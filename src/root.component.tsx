import React from "react";
import styled from "styled-components";
import GlobalStyles from "./styles/GlobalStyles";

const Notice = styled.span({
  "--tw-text-opacity": "1",
  color: "rgb(21 128 61 / var(--tw-text-opacity, 1))",
});
export default function Root(props) {
  return (
    <>
      <GlobalStyles />
      <Notice>{props.name} is mounted!</Notice>;
    </>
  );
}
