import React, { useState } from "react";
import NetworkDiagramIE from "../components/IE_VIS/network_rootsIE";
import DotHeatmap from "../components/IE_VIS/dotheatmap";
import MidiHeatmapComparison from "../components/IE_VIS/dotplotcomparison";
import ABCVisualizer from "../components/IE_VIS/pitchabc";
import NavigationBar from "../components/nav";
import VerticalNav from "../components/verticalnav";
import "../css/IEpages.css";

export default function VisIE() {
    const [currentVis, setCurrentVis] = useState(1);

    const handleNext = () => {
        if (currentVis < 4) setCurrentVis(currentVis + 1);
    };

    const handlePrev = () => {
        if (currentVis > 1) setCurrentVis(currentVis - 1);
    };
    return (
        <>
            <NavigationBar />

            <div className="visIE-container">
                {/* <VerticalNav /> */}

                {/* VIS 1 */}
                <div className="vis1" style={{ display: currentVis === 1 ? "contents" : "none" }}>
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
                </div>



                {/* VIS 2 */}
                <div className="vis2" style={{ display: currentVis === 2 ? "contents" : "none" }}>
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
                </div>


                {/* VIS 3 */}
                <div className="vis3" style={{ display: currentVis === 3 ? "contents" : "none" }}>
                    {/* Comparison */}
                    <div id="dotplot-comparison-section" className="dotplot-comparison">
                        <MidiHeatmapComparison />
                    </div>
                </div>


                {/* VIS 4 */}
                <div className="vis4" style={{ display: currentVis === 4 ? "contents" : "none" }}>
                    {/* Pitch */}
                    <div id="picth-section" className="pitch-abc">
                        <ABCVisualizer />
                    </div>
                </div >
                {/* NAVIGATION BUTTONS */}
                <div className="nav-buttons">
                    {currentVis > 1 && (
                        <button onClick={handlePrev} className="nav-btn up">↑</button>
                    )}
                    {currentVis < 4 && (
                        <button onClick={handleNext} className="nav-btn down">↓</button>
                    )}
                </div>
            </div>
        </>
    );
}
