// src/App.tsx
import { Provider } from "react-redux";
import { store } from "./store";
import FirstApp from "./FirstApp";

function App() {
  return (
    <Provider store={store}>
      <FirstApp />
    </Provider>
  );
}

export default App;
