import React from "react";
import { Spin } from "antd";

const Spinner = ({ size = "default", spinning = true, children }) => {
  return (
    <Spin size={size} spinning={spinning} className="dm-sans-font">
      {children}
    </Spin>
  );
};

export default Spinner;
