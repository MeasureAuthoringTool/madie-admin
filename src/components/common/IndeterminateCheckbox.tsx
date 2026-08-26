import React, { useEffect } from "react";

const IndeterminateCheckbox = ({ indeterminate, checked, ...rest }: any) => {
  const ref = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} checked={checked} {...rest} />;
};

export default IndeterminateCheckbox;
