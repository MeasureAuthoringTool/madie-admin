import React, { useMemo, useRef } from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { DialogContent } from "@mui/material";
import AceEditor from "react-ace";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  targetVSE: string | null;
}

export function ReadOnlyJsonEditor({
  value,
  height,
}: {
  value: string;
  height: string;
}) {
  const aceRef = useRef<AceEditor>(null);

  return (
    <AceEditor
      value={value}
      ref={aceRef}
      mode="json"
      theme="monokai"
      name="ace-editor-wrapper"
      enableBasicAutocompletion
      width="100%"
      height={height}
      showPrintMargin
      showGutter
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
        autoScrollEditorIntoView: true,
      }}
      editorProps={{ $blockScrolling: true }}
      readOnly
      wrapEnabled
    />
  );
}

export default function VSEDialog(props: ModalProps) {
  const { open = false, onClose, targetVSE } = props;
  // we get a string that's unformatted from the db. This will give it the pretty print look
  const formattedJson = useMemo(() => {
    if (!targetVSE) return "";
    try {
      return JSON.stringify(JSON.parse(targetVSE), null, 2);
    } catch {
      return targetVSE;
    }
  }, [targetVSE]);

  // editor needs a fixed size. This gives it a relatively large set of real estate for most screens.
  const editorHeight = `${window.innerHeight - 375}px`;
  return (
    <MadieDialog
      form
      title="Details"
      sx={{
        "#modal-body": {
          h2: {
            borderTop: "1px solid black",
          },
        },
      }}
      dialogProps={{
        id: "view-vse-modal",
        onClose,
        open,
        maxWidth: "lg",
        fullWidth: true,
      }}
    >
      <DialogContent>
        <div
          data-testid="read-only-modal-container"
          className="read-only-modal-container"
        >
          <ReadOnlyJsonEditor value={formattedJson} height={editorHeight} />
        </div>
      </DialogContent>
    </MadieDialog>
  );
}
