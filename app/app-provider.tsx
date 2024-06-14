import { useReducer } from "react";
import { ActionType, AppContext, ContextState } from "./context";

const initialState: ContextState = {
  selectedFolder: '',
}

const reducer = (state: ContextState, action: { type: ActionType; payload: any; }) => {
  switch (action.type) {
    case ActionType.SELECT_FOLDER:
      return {
        ...state,
        selectedFolder: action.payload,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: any; }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}