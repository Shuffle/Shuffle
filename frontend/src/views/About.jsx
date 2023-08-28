import React from "react";

const hrefStyle = {
  color: "#f85a3e",
  textDecoration: "none",
};

const About = () => {
  return (
    <div>
      <h1>About</h1>

      <p>
        Endao was started as a project in late 2018 as a free service to analyze
        APK (and soon IPA) files for vulnerabilities. The project was started
        after I,
        <a href="https://twitter.com/frikkylikeme" style={hrefStyle}>
          @frikkylikeme
        </a>
        , found multiple vulnerabilities in IoT devices based purely on their
        apps. As I wanted to learn more about these kind of vulnerabilities, I
        looked for solutions that work for my purpose, but didn't find any good,
        free and easy to use service - hence this site was born.
      </p>

      <p>
        My personal goal has and will always be to make the internet safer. As
        the IoT sphere grows, I want to be able to add ways of finding possible
        vulnerabilities fast to this website. This will hopefully include
        blogposts when I get around to it, as well as actual implementations.
        The vulnerability discovery field is in no way new, but I'll try my best
        to add whatever I can to it. As a disclaimer, I'm an "Ops" person, and I
        had never done frontend before creating this site. This is as much of a
        learning project within web development as it is in vulnerability
        discovery.
      </p>

      <p>This site currently uses the following projects</p>
      <ul>
        <li>
          <a style={hrefStyle} href="https://superanalyzer.rocks">
            SUPER Android Analyzer
          </a>
        </li>
        <li>
          <a style={hrefStyle} href="https://github.com/linkedin/qark">
            Qark
          </a>
        </li>
        <li>
          <a style={hrefStyle} href="https://virustotal.com">
            Virustotal
          </a>{" "}
          for malware checks in known APKs
        </li>
        <li>Some selfmade gibberish</li>
      </ul>

      <p>Hopefully it is of use to some people :)</p>

      <h3>Thanks</h3>
      <p>Thanks to Andy for the initial frontend help :)</p>

      <h3>Regards</h3>
      <p>
        <a href="https://twitter.com/frikkylikeme" style={hrefStyle}>
          @frikkylikeme
        </a>
      </p>
    </div>
  );
};

export default About;
