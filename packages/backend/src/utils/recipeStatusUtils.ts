import type { RecipeStatus, RecipeStatusState } from '@shared/src/models/IRecipeStatus';
import type { Task, TaskState } from '@shared/src/models/ITask';
import type { RecipeStatusRegistry } from '../registries/RecipeStatusRegistry';

export class RecipeStatusUtils {
  private tasks: Map<string, Task> = new Map<string, Task>();
  private state: RecipeStatusState = 'loading';

  constructor(
    private recipeId: string,
    private recipeStatusRegistry: RecipeStatusRegistry,
  ) {}

  update() {
    this.recipeStatusRegistry.setStatus(this.recipeId, this.toRecipeStatus());
  }

  setStatus(state: RecipeStatusState): void {
    this.state = state;
    this.update();
  }

  setTask(task: Task) {
    this.tasks.set(task.id, task);

    if (task.state === 'error') this.setStatus('error');

    this.update();
  }

  setTaskState(taskId: string, state: TaskState) {
    if (!this.tasks.has(taskId)) throw new Error('task not found.');
    const task = this.tasks.get(taskId);
    this.setTask({
      ...task,
      state: state,
    });
  }

  setTaskProgress(taskId: string, value: number) {
    if (!this.tasks.has(taskId)) throw new Error('task not found.');
    const task = this.tasks.get(taskId);
    this.setTask({
      ...task,
      progress: value,
    });
  }

  toRecipeStatus(): RecipeStatus {
    return {
      recipeId: this.recipeId,
      state: this.state,
      tasks: Array.from(this.tasks.values()),
    };
  }
}
