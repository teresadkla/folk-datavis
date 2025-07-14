import { useEffect, useRef, useState } from 'react';
import * as anime from 'animejs';
import '../css/home.css'; 

function ScrollIntro() {
  const sectionsRef = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.4,
    };

    const observer = new IntersectionObserver((entries) => {
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

          observer.unobserve(entry.target); // remove se quiser animar só 1x
        }
      });
    }, observerOptions);

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div className="scroll-wrapper">
      {/* Dots on the left */}
      <div className="dots-container">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`dot ${activeIndex === i ? 'active' : ''}`}
          ></div>
        ))}
      </div>

      {/* Content */}
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
  );
}

export default ScrollIntro;
