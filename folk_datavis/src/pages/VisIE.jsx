import React from "react";
import NetworkDiagramIE from "../components/IE_VIS/network_rootsIE";
import DotHeatmap from "../components/IE_VIS/dotheatmap";
import MidiHeatmapComparison from "../components/IE_VIS/dotplotcomparison";
import ABCVisualizer from "../components/IE_VIS/pitchabc";
import NavigationBar from "../components/nav";
import VerticalNav from "../components/verticalnav";
import "../css/IEpages.css";

export default function visPT() {
    return (
        <>
            <NavigationBar />

            <div className="visIE-container">
                {/* <VerticalNav /> */}

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
                <div id="network-IE-section" className="visIE-roots">
                    <NetworkDiagramIE />
                </div>

                {/* Heatmap dots */}
                <div className="Types-description">
                    <h2 className="Types-title">
                    Types of Irish folk 
                    </h2>
                    <p className="Types-text-IE">
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
                <div id="heatmap-section" className="heatmap-types">
                    <DotHeatmap />
                </div>

                {/* Comparison */}
                <div id="dotplot-comparison-section" className="dotplot-comparison">
                    <MidiHeatmapComparison />
                </div>

                {/* Pitch */}
                <div id="picth-section" className="pitch-abc">
                    <ABCVisualizer />  
                </div>
            </div>
        </>
    );
}
