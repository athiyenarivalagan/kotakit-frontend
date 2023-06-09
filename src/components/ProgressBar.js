import { Progress } from 'antd';

const ProgressBar = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Progress type="circle" percent={0} size={100} />
        <h3 style={{
            marginTop: "12px",
            fontSize: "1.2rem",
            fontFamily: "Poppins, sans-serif",
            backgroundImage: "linear-gradient(120deg, #273c75, #4b6cb7)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent"
            }}>
            {`Project is ${0}% complete.`}
        </h3>
    </div>
  )
}

export default ProgressBar