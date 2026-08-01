export type DeleteConfirmationState = "closed" | "open" | "deleting";
export type DeleteConfirmationAction = "open" | "cancel" | "confirm" | "success" | "failure";

export function transitionDeleteConfirmation(
  state: DeleteConfirmationState,
  action: DeleteConfirmationAction,
): DeleteConfirmationState {
  if (action === "open") return state === "closed" ? "open" : state;
  if (action === "cancel") return state === "open" ? "closed" : state;
  if (action === "confirm") return state === "open" ? "deleting" : state;
  if (action === "success") return state === "deleting" ? "closed" : state;
  if (action === "failure") return state === "deleting" ? "open" : state;
  return state;
}
