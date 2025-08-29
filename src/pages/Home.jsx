import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "../css/home.css";

// Registra o plugin ScrollTrigger para animações baseadas em scroll
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    // Hook para navegação entre páginas
    const navigate = useNavigate();
    
    // Referência para array de seções da página
    const sectionsRef = useRef([]);
    
    // Referência para o wrapper principal de scroll
    const scrollWrapperRef = useRef(null);
    
    // Referência para a seção inicial da homepage
    const homepageRef = useRef(null);
    
    // Estado para controlar qual seção está ativa (para os dots de navegação)
    const [activeIndex, setActiveIndex] = useState(0);
    
    // Estado para controlar a visibilidade dos dots de navegação
    const [showDots, setShowDots] = useState(false);

    useEffect(() => {
        // Configurações padrão para todos os ScrollTriggers
        ScrollTrigger.defaults({
            toggleActions: "play reverse play reverse",
            markers: false, // Remove marcadores de debug
        });

        // Configura animações de entrada para cada seção
        sectionsRef.current.forEach((section, i) => {
            if (section) {
                // Animação de fade in com movimento vertical
                gsap.fromTo(section,
                    { autoAlpha: 0, y: 40 }, // Estado inicial: invisível e deslocado para baixo
                    {
                        autoAlpha: 1, // Estado final: visível
                        y: 0, // Estado final: posição original
                        duration: 1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: section, // Elemento que dispara a animação
                            start: "top top", // Inicia quando o topo da seção atinge o topo da viewport
                            end: "bottom top", // Termina quando a parte inferior da seção atinge o topo da viewport
                            pin: true, // Fixa a seção durante a animação
                            // Callbacks para atualizar o índice ativo
                            onEnter: () => setActiveIndex(i),
                            onEnterBack: () => setActiveIndex(i),
                            toggleActions: 'play reverse play reverse',
                        }
                    }
                );
            }
        });

        // Animação de fade out da homepage quando a primeira seção entra
        if (sectionsRef.current[0] && homepageRef.current) {
            gsap.to(homepageRef.current, {
                autoAlpha: 0, // Torna invisível
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: sectionsRef.current[0],
                    start: 'top center', // Inicia quando o topo da primeira seção atinge o centro da viewport
                    end: 'bottom center',
                    toggleActions: 'play reverse play reverse',
                }
            });
        }

        // Observer para controlar visibilidade dos dots de navegação
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => setShowDots(entry.isIntersecting));
        }, { threshold: 0.1 }); // Ativa quando 10% do elemento está visível

        if (scrollWrapperRef.current) observer.observe(scrollWrapperRef.current);

        // Cleanup: remove todos os ScrollTriggers e desconecta o observer
        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
            observer.disconnect();
        };
    }, []);

    // Função para navegar para a página portuguesa
    const handleExploreClick = () => {
        navigate('/portuguese');
    };

    return (
        <div className="home-intro">
            {/* Seção inicial da homepage */}
            <div className="homepage" ref={homepageRef}>
                <div className="home">
                    <h1>The Wandering Song</h1>
                    <p>
                        A digital space for the characteristics of Portuguese and Irish Folk Music focused
                        on the visualization of data and storytelling, where it is possible to trace the path
                        and roots of all the music that wanders through generations, but is never lost.
                    </p>

                    {/* Seta animada indicando para rolar para baixo */}
                    <div className="scrollDownArrow" style={{
                        textAlign: 'center',
                        fontSize: '2rem',
                        marginTop: '2rem',
                        animation: 'bounce 2s infinite'
                    }}>
                        ↓
                    </div>
                </div>
            </div>

            {/* Container principal para as seções com scroll */}
            <div className="scroll-wrapper" ref={scrollWrapperRef}>
                {/* Dots de navegação - só aparecem quando o scroll-wrapper está visível */}
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
                    {/* Mapeia as 5 seções da introdução */}
                    {["part1", "part2", "part3", "part4", "part5"].map((cls, i) => (
                        <div
                            key={cls}
                            className={cls}
                            ref={(el) => sectionsRef.current[i] = el} // Armazena referência de cada seção
                        >
                           {(() => {
  // Array com os textos para cada seção
  const texts = [
    "Folk music embodies the stories of the land and the people through sound!",
    "Two distant lands however both with profound musical roots!",
    "In Portugal we follow the impact that the territory has in the variation of folk music.",
    "On the other side, in Ireland we will explore the sound and how its genres within folk variate from song to song.",
    "This experience is meant to show how folk music is intertwined by land and sound."
  ];

  // Objeto com as imagens para cada seção
  const images = {
    part1: ["/img/PT1.png", "/img/IE1.png"],
    part2: ["/img/PT map.png", "/img/IE map.png"],
    part3: ["/img/PT elements.png"],
    part4: ["/img/IE elements.png"],
  };

  const currentPart = `part${i + 1}`;
  const currentImages = images[currentPart] || [];

  return (
    <>
      {/* Texto da seção atual */}
      <p className={`t${i + 1}`}>{texts[i]}</p>
      
      {/* Container para imagens da seção */}
      <div className="section-images">
        {currentImages.map((src, idx) => (
          <img
            key={idx}
            id={`${currentPart}-img${idx + 1}`}
            src={src}
            alt={`Image ${idx + 1} for ${currentPart}`}
          />
        ))}
      </div>
      
      {/* Botão de exploração - apenas aparece na última seção (parte 5) */}
      {i === 4 && (
        <div className="connection">
          <button className="buttonToGraphs" onClick={handleExploreClick}>
            Start Exploring
          </button>
        </div>
      )}
    </>
  );
})()}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
