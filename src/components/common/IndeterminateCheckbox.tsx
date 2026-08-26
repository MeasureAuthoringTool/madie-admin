import React, { useEffect } from "react";

type IndeterminateCheckboxProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "type"
> & {
  indeterminate?: boolean;
};

const IndeterminateCheckbox = ({
  indeterminate = false,
  checked,
  ...rest
}: IndeterminateCheckboxProps) => {
  const ref = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} checked={checked} {...rest} />;
};

export default IndeterminateCheckbox;
