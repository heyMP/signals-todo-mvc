import * as Signal from '@heymp/signals';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export type TodoEdit = Partial<Todo> & { id: string };

const todoFilters = ["all", "active", "completed"] as const;

export type TodoFilter = (typeof todoFilters)[number];

function isTodoFilter(value: string | undefined): value is TodoFilter {
  return todoFilters.includes(value as TodoFilter);
}

export class TodosSignal extends Signal.State<Todo[]> {
  constructor(value: Todo[]) {
    super(value);
  }

  add(text: string) {
    const todo = {
      text,
      completed: false,
      id: window.crypto.randomUUID(),
    } satisfies Todo;
    this.value = [...this.value, todo];
  }

  delete(id: string) {
    this.value = this.value.filter(i => i.id !== id);
  }

  removeTodo(id: string) {
    this.value = this.value.filter(i => i.id !== id);
  }

  update(edit: TodoEdit) {
    this.value = this.value.map(i => {
      if (i.id === edit.id) {
        return Object.assign(i, edit);
      }
      return i;
    });
  }

  toggleAll() {
    // First pass to see if all the TODOs are completed. If all the
    // todos are completed, we'll set them all to active
    const allComplete = this.value.every((todo) => todo.completed);

    // Replace the list to trigger updates
    this.value = this.value.map((todo) => ({
      ...todo,
      completed: !allComplete,
    }));
  }

  clearCompleted() {
    this.value = this.value.filter(i => !i.completed);
  }
}

export const todos = new TodosSignal([]);
export const filter = new Signal.State<TodoFilter>(getFilter());
export const activeTodos = new Signal.Computed(() => todos.value.filter(i => !i.completed).length, [todos]);
export const completedTodos = new Signal.Computed(() => todos.value.filter(i => i.completed), [todos]);
export const filteredTodos = new Signal.Computed(() => todos.value.filter(i => {
  switch (filter.value) {
    case "active":
      return !i.completed;
    case "completed":
      return i.completed;
  }
  return i;
}), [todos, filter]);

window.addEventListener("hashchange", () => {
  filter.value = getFilter();
});

function getFilter(): TodoFilter {
  let filter = /#\/(.*)/.exec(window.location.hash)?.[1];
  if (isTodoFilter(filter)) {
    return filter;
  }
  return 'all';
}
