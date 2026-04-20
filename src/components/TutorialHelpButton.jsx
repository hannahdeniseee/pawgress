import { useNavigate } from "react-router-dom";

export default function TutorialHelpButton() {
  const navigate = useNavigate();

  return (
    <button style={styles.fab} onClick={() => navigate("/help")}>
      ?
    </button>
  );
}

const styles = {
  fab: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#4f46e5",
    color: "white",
    fontSize: "22px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    zIndex: 10000,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  },
};