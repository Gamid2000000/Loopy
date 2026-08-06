import { Link } from "react-router-dom"; import { Card } from "../../ui/Card";
export function ForumAuthPrompt({ returnTo, children }: { returnTo: string; children: string }) { return <Card><p>{children}</p><Link to="/login" state={{ returnTo }}>{"Войти"}</Link></Card>; }
