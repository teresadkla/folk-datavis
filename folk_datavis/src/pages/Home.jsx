import { useNavigate } from 'react-router-dom'
import "../css/home.css"

const Home = () => {
    const navigate = useNavigate()
    
    const handleExploreClick = () => {
        // Pode redirecionar para a página que quiser
        navigate('/portuguese') // ou '/irish' se preferir
    }

    return (
        <div className="homepage">
            <div className="home">
                <h1>The Wandering Song</h1>
                <p>A digital space for the characteristics of Portuguese and Irish Folk Music focused
                    on the visualization of data and storytelling, 
                    where it is possible to trace the path and roots of all the 
                    music that wanders through generations, but is never lost.</p>
            </div>
            <div className="connection">
                <button className="buttonToGraphs" onClick={handleExploreClick}>
                    {/* Substitua pelo caminho correto do seu ícone */}
                    <img src="/path/to/your/icon.png" alt="Explore" />
                </button>
                <p>Click here to start exploring!</p>
            </div>
        </div>
    )
}

export default Home