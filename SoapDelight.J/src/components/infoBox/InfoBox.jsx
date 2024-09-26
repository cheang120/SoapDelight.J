import React from "react";
import Card from "../card/Card";
import styles from "./InfoBox.module.scss";

const InfoBox = ({ cardClass, title, count, icon }) => {
  return (
    <div className={`${styles["info-box"]} bg-white dark:bg-gray-800`}>
      <Card cardClass={`${cardClass} bg-white dark:bg-gray-800 dark:border-gray-700`}>
        <h4 className="text-gray-900 dark:text-white">{title}</h4>
        <span className="flex items-center justify-between mt-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</h3>
          {icon}
        </span>
      </Card>
    </div>
  );
};

export default InfoBox;
