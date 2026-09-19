import { Route, Switch } from "wouter";
import Portfolio from "./components/Portfolio";
import ProjectsPage from "./pages/Projects";
import { ShaderBackground } from "./components/ShaderBackground";

function App() {
  return (
    <>
      <div className="pf-app-shader" aria-hidden="true">
        <ShaderBackground color1="#000000" color2="#1a1a1f" speed={0.6} />
      </div>
      <Switch>
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/" component={Portfolio} />
        <Route component={Portfolio} />
      </Switch>
    </>
  );
}

export default App;
