import { Link } from "react-router-dom"; import { Button } from "../../components/ui/Button";
export function StudyEntryPage() { return <main className="page"><h1>Начать занятие</h1><p>Выберите активную колоду, чтобы начать новое занятие или продолжить существующее.</p><Link to="/decks"><Button>К колодам</Button></Link></main>; }
