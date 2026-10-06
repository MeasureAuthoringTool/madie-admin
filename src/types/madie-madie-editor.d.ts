declare module "@madie/madie-editor" {
  import { FC } from "react";

  // Minimal surface of the Monaco editor instance used by the admin app.
  export interface MadieJsonEditorInstance {
    getValue: () => string;
    setValue: (value: string) => void;
    getAction: (id: string) => { run: () => void } | null;
    onDidPaste: (listener: () => void) => void;
    onDidBlurEditorText: (listener: () => void) => void;
    // Allow any other Monaco editor method without strict typing.
    [key: string]: any;
  }

  export interface JsonMonacoEditorProps {
    value: string;
    onChange?: (value: string) => void;
    height?: string | number;
    width?: string | number;
    readOnly?: boolean;
    theme?: string;
    ariaLabel?: string;
    testId?: string;
    inputTestId?: string;
    enableToggleSearchEvent?: false | true | { eventName: string };
    options?: unknown;
    onEditorMount?: (
      editor: MadieJsonEditorInstance,
      monacoInstance: unknown
    ) => void;
  }

  export const MadieJsonEditor: FC<JsonMonacoEditorProps>;
}
