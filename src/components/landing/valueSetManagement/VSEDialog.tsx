import React, { useEffect, useMemo, useRef, useState } from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { DialogContent } from "@mui/material";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  targetVSE: string | null;
}

export default function VSEDialog(props: ModalProps) {
  const { open = false, onClose, targetVSE } = props;
  const aceRef = useRef<AceEditor>(null);
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
  const [editorHeight, setEditorHeight] = useState(
    `${window.innerHeight - 375}px`
  );

  useEffect(() => {
    const handleResize = () => {
      setEditorHeight(`${window.innerHeight - 200}px`);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
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
        id: "view-hr-modal",
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
          <AceEditor
            value={formattedJson || ""}
            ref={aceRef}
            mode="json"
            theme="monokai"
            name="ace-editor-wrapper"
            enableBasicAutocompletion={true}
            width="100%"
            height={editorHeight}
            showPrintMargin={true}
            showGutter={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
              autoScrollEditorIntoView: true,
            }}
            editorProps={{ $blockScrolling: true }}
            readOnly={true}
            wrapEnabled={true}
          />
        </div>
      </DialogContent>
    </MadieDialog>
  );
}
