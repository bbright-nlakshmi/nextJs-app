/* eslint-disable @next/next/no-img-element */
import React, { Fragment, useEffect, useState } from "react";

const Loader = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setTimeout(function () {
      setIsLoading(false);
    }, 1000);
  }, []);
  return <Fragment>{props.children}</Fragment>;
};

export default Loader;
