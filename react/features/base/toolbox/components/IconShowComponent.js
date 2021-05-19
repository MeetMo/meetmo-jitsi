/**import React from 'react';
import { ReactSVG } from 'react-svg';

declare var interfaceConfig: Object;

function LoadSVG() {

  if(interfaceConfig.microphone_button && interfaceConfig.microphone_button.svg) {
      //let content = '';
      console.log("NEWCOMPONENT", interfaceConfig.microphone_button);
      fetch(interfaceConfig.microphone_button.svg)
    	 .then(res => res.text())
    	 .then(text => return <div dangerouslySetInnerHTML={{__html: text}} /> );

    //return <ReactSVG src={interfaceConfig.microphone_button.svg} />;
  }
  //return <div />;
}
 
export default LoadSVG;
*/

import React, { useState, useEffect } from "react";
declare var interfaceConfig: Object;

var LoadSVG = function SVG() {
  const [commitHistory, setCommitHistory] = useState([]);
  useEffect(() => {
    fetch(
      interfaceConfig.microphone_button.svg,
      {
        method: "GET"
      }
    )
      .then(res => res.text())
      .then(response => {
        setCommitHistory(response);
      })
      .catch(error => console.log(error));
  }, [page]);

  return (
    <div dangerouslySetInnerHTML={{__html: commitHistory}} />
  );
}

export default LoadSVG;
