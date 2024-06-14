import { Dispatch, createContext, useContext } from "react";

export type ContextState = {
  selectedFolder: string;
}

export enum ActionType {
  SELECT_FOLDER = 'SELECT_FOLDER',
}

export const AppContext = createContext<{ state: any; dispatch: Dispatch<{ type: any; payload: any; }> }>({ state: null, dispatch: () => {} });
export const useAppContext = () => useContext(AppContext);