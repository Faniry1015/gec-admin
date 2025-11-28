const Footer = () => {
  const year = new Date().getFullYear();
  const portfolioUrl = "https://portfolio.example.com"; // remplace par l'URL de ton portfolio

  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "16px 24px",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "14px",
        color: "#334155",
      }}
    >
      <span>© {year} HarmonyEco - Antsakaviro</span>
      <a
        href={portfolioUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#2563eb",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Développé par Faniriantsoa RANDRIAHARIMINO
        <span aria-hidden style={{ fontSize: "12px" }}>
          ↗
        </span>
      </a>
    </footer>
  );
};

export default Footer;
