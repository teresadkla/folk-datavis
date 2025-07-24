import React, { useState } from "react";
import NetworkDiagramIE from "../components/IE_VIS/network_rootsIE";
import DotPlotTypes from "../components/IE_VIS/dotplottype";
import MidiHeatmapComparison from "../components/IE_VIS/heatmapcomparison";
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
                <div className="vis1" style={{ display: currentVis === 1 ? "grid" : "none" }}>
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
                        {currentVis === 1 && <NetworkDiagramIE />}
                    </div>
                </div>



                {/* VIS 2 */}
                <div className="vis2" style={{ display: currentVis === 2 ? "grid" : "none" }}>
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
                    <div id="dptypes-section" className="dotplot-types">
                        {currentVis === 2 && <DotPlotTypes active={true} />}
                    </div>
                </div>


                {/* VIS 3 */}
                <div className="vis3" style={{ display: currentVis === 3 ? "grid" : "none" }}>
                    <div id="dotplot-comparison-section" className="dotplot-comparison">
                        {currentVis === 3 && <MidiHeatmapComparison />}
                    </div>
                </div>


                {/* VIS 4 */}
                <div className="vis4" style={{ display: currentVis === 4 ? "grid" : "none" }}>
                    <div id="picth-section" className="pitch-abc">
                        {currentVis === 4 && <ABCVisualizer />}
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
