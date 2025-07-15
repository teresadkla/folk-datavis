import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "../css/home.css";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    const navigate = useNavigate();
    const sectionsRef = useRef([]);
    const scrollWrapperRef = useRef(null);
    const homepageRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showDots, setShowDots] = useState(false);

    useEffect(() => {
        ScrollTrigger.defaults({
            toggleActions: "play reverse play reverse",
            markers: false,
        });

        // Animação de entrada para cada seção
        sectionsRef.current.forEach((section, i) => {
            if (section) {
                gsap.fromTo(section,
                    { autoAlpha: 0, y: 40 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: section,
                            start: "top top",
                            end: "bottom top",
                            pin: true,
                            onEnter: () => setActiveIndex(i),
                            onEnterBack: () => setActiveIndex(i),
                            toggleActions: 'play reverse play reverse',
                        }
                    }
                );
            }
        });

        // Fade out da homepage ao entrar na part1
        if (sectionsRef.current[0] && homepageRef.current) {
            gsap.to(homepageRef.current, {
                autoAlpha: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionsRef.current[0],
                    start: 'top center',
                    end: 'bottom center',
                    toggleActions: 'play reverse play reverse',
                }
            });
        }

        // Mostrar ou ocultar os dots dependendo da visibilidade do scroll-wrapper
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => setShowDots(entry.isIntersecting));
        }, { threshold: 0.1 });

        if (scrollWrapperRef.current) observer.observe(scrollWrapperRef.current);

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
            observer.disconnect();
        };
    }, []);

    const handleExploreClick = () => {
        navigate('/portuguese');
    };

    return (
        <div className="home-intro">
            <div className="homepage" ref={homepageRef}>
                <div className="home">
                    <h1>The Wandering Song</h1>
                    <p>
                        A digital space for the characteristics of Portuguese and Irish Folk Music focused
                        on the visualization of data and storytelling, where it is possible to trace the path
                        and roots of all the music that wanders through generations, but is never lost.
                    </p>

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
                    {["part1", "part2", "part3", "part4", "part5"].map((cls, i) => (
                        <div
                            key={cls}
                            className={cls}
                            ref={(el) => sectionsRef.current[i] = el}
                        >
                            <p className={`t${i + 1}`}>
                                {[
                                    "Folk music embodies the stories of the land and the people through sound!",
                                    "Two distant lands however both with profound musical roots!",
                                    "In Portugal we follow the impact that the territory has in the variation of folk music.",
                                    "On the other side, in Ireland we will explore the sound and how its genres within folk variate from song to song.",
                                    "This experience is meant to show how folk music is intertwined by land and sound."
                                ][i]}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
