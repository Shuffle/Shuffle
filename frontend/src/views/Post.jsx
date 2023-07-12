import React from "react";

const Body = {
  maxWidth: "1000px",
  minWidth: "768px",
  margin: "auto",
  display: "flex",
  heigth: "100%",
  color: "white",
  //textAlign: "center",
};

const SideBar = {
  maxWidth: "250px",
  flex: "1",
};

const hrefStyle = {
  color: "#385f71",
  textDecoration: "none",
};

const Post = (props) => {
  const { currentPost, isLoaded } = props;

  const postData = (
    <div style={Body}>
      <div style={SideBar}>
        <ul style={{ listStyle: "none", paddingLeft: "0" }}>
          <li style={{ marginTop: "10px" }}>
            <a style={hrefStyle} href="/">
              <h2>Home</h2>
            </a>
          </li>
          <li style={{ marginTop: "10px" }}>
            <a style={hrefStyle} href="/docs">
              <h2>Schedules</h2>
            </a>
          </li>
          <li style={{ marginTop: "10px" }}>
            <a style={hrefStyle} href="/docs/about">
              <h2>About</h2>
            </a>
          </li>
          <li style={{ marginTop: "10px" }}>
            <a style={hrefStyle} href="/docs/privacy-policy">
              <h2>Privacy Policy</h2>
            </a>
          </li>
        </ul>
      </div>
      <div style={{ flex: "1" }}>{currentPost}</div>
    </div>
  );

  const loadedCheck = isLoaded ? <div>{postData}</div> : <div></div>;

  return <div>{loadedCheck}</div>;
};

export default Post;
