import { Route, Switch } from "wouter";
import Cinema from "./cinema/Cinema";
import ProjectsPage from "./pages/Projects";

export default function App() {
  return (
    <Switch>
      <Route path="/projects" component={ProjectsPage} />
      <Route component={Cinema} />
    </Switch>
  );
}
