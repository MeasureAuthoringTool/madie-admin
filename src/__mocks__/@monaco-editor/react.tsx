// Global Jest mock for `@monaco-editor/react`.
//
// Renders a lightweight <textarea> stand-in instead of loading the real Monaco
// editor (which needs browser APIs jsdom lacks and pulls in web workers). This
// lets any suite that transitively imports a Monaco-based component run without
// each test having to declare its own inline mock.
import * as React from "react";

interface MockMonacoEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: unknown) => void;
}

export const loader = {
  config: jest.fn(),
  init: jest.fn().mockResolvedValue({}),
};

export default function MockMonacoEditor({
  value,
  onChange,
  onMount,
}: MockMonacoEditorProps) {
  React.useEffect(() => {
    onMount?.({
      getValue: () => value ?? "",
      getAction: () => ({ run: jest.fn() }),
      onDidPaste: () => undefined,
      onDidBlurEditorText: () => undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      data-testid="mock-monaco-editor"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}
