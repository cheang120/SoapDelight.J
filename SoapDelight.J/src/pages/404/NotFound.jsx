import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="--center-all" style={{ minHeight: "80vh" }}>
      <h2>找不到頁面</h2>
      <p>你要查看的頁面可能不存在或已被移除。</p>
      <br />
      <Link to={"/"}>
        <button className="--btn --btn-primary">返回首頁</button>
      </Link>
    </div>
  );
};

export default NotFound;
