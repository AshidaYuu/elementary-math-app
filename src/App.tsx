
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom'
import Home from './pages/Home'
import Stages from './pages/Stages'
import PlayPage from './pages/PlayPage'

const PlayPageWrapper = () => {
    const { stageId } = useParams();
    return <PlayPage key={stageId} />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/stages" element={<Stages />} />
                <Route path="/play/:stageId" element={<PlayPageWrapper />} />
            </Routes>
        </Router>
    )
}

export default App
