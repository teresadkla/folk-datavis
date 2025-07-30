import React, { useState } from "react";
import NetworkDiagramIE from "../components/IE_VIS/network_rootsIE";
import DotPlotTypes from "../components/IE_VIS/dotplottype";
import MidiHeatmapComparison from "../components/IE_VIS/heatmapcomparison";
import ABCVisualizer from "../components/IE_VIS/pitchabc";
import ChordDiagramABC from "../components/IE_VIS/pitchabc";
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
                            Irish Musical Roots
                        </h2>
                        <p className="roots-text-IE">
                            Irish folk songs take shape not only through words and melodies, but through the ways they’re sung. 
                            This visualization uncovers how songs connect through shared musical modes and stylistic interpretations.
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
                      Irish folk songs often exist in multiple forms, reshaped by the musical categories they belong to. This visualization explores how songs vary across styles — from dance tunes to laments — revealing the creative diversity that lives within shared traditions. 
                      Each point is a variation, a window into how structure and expression intertwine in the folk repertoire.
                        </p>
                    </div>
                    <div id="dptypes-section" className="dotplot-types">
                        {currentVis === 2 && <DotPlotTypes active={true} />}
                    </div>
                </div>


                {/* VIS 3 */}
                <div className="vis3" style={{ display: currentVis === 3 ? "grid" : "none" }}>
                    <div className="heatmap-comparison-description">
                        <h2 className="heatmap-comparison-title">Heat of the Melody</h2>
                        <p className="heatmap-comparison-text">
                        Every variation of a folk song tells a slightly different musical story. This heatmap uncovers those differences by highlighting the notes most frequently played across versions — revealing which tones anchor the melody, and where change happens. 
                        As time unfolds, we see not just how songs shift, but how tradition evolves through subtle musical choices.
                        </p>
                    </div>
                    <div id="heatmap-comparison-section" className="heatmap-comparison">
                        {currentVis === 3 && <MidiHeatmapComparison />}
                    </div>
                </div>


                {/* VIS 4 */}
                <div className="vis4" style={{ display: currentVis === 4 ? "grid" : "none" }}>
                    <div className="pitch-abc-description">
                        <h2 className="pitch-abc-title">The ABCs of Irish Folk</h2>
                        <p className="pitch-abc-text"></p>
                        </div>
                    <div id="picth-section" className="pitch-abc">
                        {currentVis === 4 && <ChordDiagramABC />}
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
