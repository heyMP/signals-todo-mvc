import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { bound } from '@patternfly/pfe-core/decorators/bound.js';
import * as store from './store.js';
import type { Todo } from './store.js';
import { watchSignal } from '@heymp/signals/lit';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('todos-mvc')
export class TodosMvc extends LitElement {
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  @watchSignal
  todos = store.todos;

  @watchSignal
  filteredTodos = store.filteredTodos;

  @watchSignal
  activeTodos = store.activeTodos;

  @state()
  editingItem?: string;

  newTodoInputKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLInputElement;
    store.todos.add(target.value);
    target.value = '';
  }

  @bound
  renderTodoItem(todo: Todo) {
    const editing = todo.id === this.editingItem;

    const startEditing = async () => {
      this.editingItem = todo.id;
      await this.updateComplete;
      const editInput = this.renderRoot.querySelector('input.edit');
      if (!(editInput instanceof HTMLInputElement)) return;
      editInput.focus();
    }

    const updateText = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Enter') return;
      }
      if (!(e.target instanceof HTMLInputElement)) return;
      store.todos.update({ ...todo, text: e.target.value });
      this.editingItem = undefined;
    }

    const updateCompleted = (e: Event) => {
      if (!(e?.target instanceof HTMLInputElement)) return;
      store.todos.update({ ...todo, completed: e.target.checked });
    }

    const removeTodo = () => {
      store.todos.removeTodo(todo.id);
    }

    return html`
      <li class=${classMap({ 'completed': todo.completed, 'editing': editing })}>
        <div class="view">
          <input class="toggle" type="checkbox" .checked=${todo.completed} @input=${updateCompleted}>
          <label @dblclick=${startEditing}>${todo.text}</label>
          <button class="destroy" @click=${removeTodo}></button>
        </div>
        ${editing ? html`<input class="edit" .value=${todo.text} @blur=${updateText} @keydown=${updateText}>` : ''}
      </li>
    `;
  }

  render() {
    return html`
      <section class="todoapp">
          <header class="header">
              <h1>todos</h1>
              <input class="new-todo" placeholder="What needs to be done?" autofocus @keydown=${this.newTodoInputKeydown} />
          </header>
            <main class="main">
                <div class="toggle-all-container">
                    <input class="toggle-all" type="checkbox" />
                    <label class="toggle-all-label" for="toggle-all">Mark all as complete</label>
                </div>
                <ul class="todo-list">
                  ${repeat(store.filteredTodos.value, (item) => item.id, this.renderTodoItem)}
                </ul>
            </main>
            <footer class="footer">
                <span class="todo-count"><strong>${store.activeTodos.value}</strong> item left</span>
                <ul class="filters">
                    <li>
                        <a href="#/" class=${classMap({ selected: store.filter.value === 'all' })}>All</a>
                    </li>
                    <li>
                        <a href="#/active" class=${classMap({ selected: store.filter.value === 'active' })}}>Active</a>
                    </li>
                    <li>
                        <a href="#/completed" class=${classMap({ selected: store.filter.value === 'completed' })}}>Completed</a>
                    </li>
                </ul>
                ${store.completedTodos.value.length > 0 ? html`
                  <button class="clear-completed" @click=${() => store.todos.clearCompleted()}>Clear completed</button>
                `: ''}
            </footer>
        </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p><a href="https://github.com/heyMP/signals-todo-mvc">Signals Todo MVC</a></p>
        <p>Created by the <a href="https://github.com/heyMP">heyMP</a> using <a href="https://github.com/heyMP/signals">@heymp/signals</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'todos-mvc': TodosMvc
  }
}
