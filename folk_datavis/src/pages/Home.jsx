import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as anime from 'animejs';
import "../css/home.css";

const Home = () => {
    const navigate = useNavigate();
    const sectionsRef = useRef([]);
    const scrollWrapperRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showDots, setShowDots] = useState(false);

    useEffect(() => {
        const observerOptions = {
            threshold: 0.4,
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const index = sectionsRef.current.indexOf(entry.target);

                if (entry.isIntersecting) {
                    setActiveIndex(index);
                    anime({
                        targets: entry.target,
                        translateY: [40, 0],
                        opacity: [0, 1],
                        duration: 1000,
                        easing: 'easeOutExpo'
                    });

                    sectionObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        sectionsRef.current.forEach((section) => {
            if (section) sectionObserver.observe(section);
        });

        const scrollWrapperObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                setShowDots(entry.isIntersecting);
            });
        }, { threshold: 0.1 });

        if (scrollWrapperRef.current) {
            scrollWrapperObserver.observe(scrollWrapperRef.current);
        }

        return () => {
            sectionObserver.disconnect();
            scrollWrapperObserver.disconnect();
        };
    }, []);

    const handleExploreClick = () => {
        navigate('/portuguese');
    };

    return (
        <div className="home-intro">
            <div className="homepage">
                <div className="home">
                    <h1>The Wandering Song</h1>
                    <p>
                        A digital space for the characteristics of Portuguese and Irish Folk Music focused
                        on the visualization of data and storytelling, where it is possible to trace the path
                        and roots of all the music that wanders through generations, but is never lost.
                    </p>

                    {/* Setinha de scroll */}
                    <div className="scrollDownArrow" style={{
                        textAlign: 'center',
                        fontSize: '2rem',
                        marginTop: '2rem',
                        animation: 'bounce 2s infinite'
                    }}>
                        ↓
                    </div>
                </div>

                <div className="connection">
                    <button className="buttonToGraphs" onClick={handleExploreClick}>
                        <img src="/path/to/your/icon.png" alt="Explore" />
                    </button>
                    <p>Click here to start exploring!</p>
                </div>
            </div>

            {/* Scrollable intro */}
            <div className="scroll-wrapper" ref={scrollWrapperRef}>
                {showDots && (
                    <div className="dots-container">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`dot ${activeIndex === i ? 'active' : ''}`}
                            ></div>
                        ))}
                    </div>
                )}

                <div className='intro-container'>
                    <div className="part1" ref={el => sectionsRef.current[0] = el}>
                        <p className='t1'>
                            Folk music embodies the stories of the land and the people through sound!
                        </p>
                    </div>
                    <div className="part2" ref={el => sectionsRef.current[1] = el}>
                        <p className='t2'>
                            Two distant lands however both with profound musical roots!
                        </p>
                    </div>
                    <div className="part3" ref={el => sectionsRef.current[2] = el}>
                        <p className='t3'>
                            In Portugal we follow the impact that the territory has in
                            the variation of folk music.
                        </p>
                    </div>
                    <div className="part4" ref={el => sectionsRef.current[3] = el}>
                        <p className='t4'>
                            On the other side, in Ireland we will explore the sound
                            and how its genres within folk variate from song to song.
                        </p>
                    </div>
                    <div className="part5" ref={el => sectionsRef.current[4] = el}>
                        <p className='t5'>
                            This experience is meant to show how folk music is intertwined
                            by land and sound.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
