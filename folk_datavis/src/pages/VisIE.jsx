import React from "react";
import NetworkDiagramIE from "../components/IE_VIS/network_rootsIE";
import NavigationBar from "../components/nav";
import VerticalNav from "../components/verticalnav";
import "../css/IEpages.css";

export default function visPT() {
    return (
        <>
            <NavigationBar />

            <div className="visIE-container">
                <VerticalNav />

                {/* Descriptive Text */}
                <div className="roots-description-IE">
                    <h2 className="roots-title-IE">
                    Song variation considering the change in the musical Mode
                    </h2>
                    <p className="roots-text-IE">
                        Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
                        pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
                        Tristique risus volutpat viverra nibh phasellus massa magna urna.
                        Non mauris enim mus egestas.
                        <br /><br />
                        Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
                        pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
                        Tristique risus volutpat viverra nibh phasellus massa magna urna.
                        Non mauris enim mus egestas.
                    </p>
                </div>
                {/* Network Diagram */}
                <div id="network-section" className="vispt-roots">
                    <NetworkDiagramIE />
                </div>

                {/* Heatmap dots */}
                <div className="Types-description">
                    <h2 className="Types-title">
                    Types of Irish folk 
                    </h2>
                </div>
                <div id="heatmap-section" className="heatmap-types">
                  
                </div>

                {/* Comparison */}
                <div id="dotplot-comparison-section" className="dotplot-comparison">
                 
                </div>

                {/* Pitch */}
                <div id="picth-section" className="pitch-abc">
                    
                </div>
            </div>
        </>
    );
}
