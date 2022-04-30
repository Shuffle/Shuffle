import React from "react";

const title = {
    display: "flex",
    flexDirection: "row",
    align: "center",
    fontWeight: "400",
    padding: "40px",
    position: "relative",
    background: "#D0241B",
    color: "#FFFFFF",
};

const contImage = {
    position: "relative",
    padding: "35px",
    display: "flex",
    flexDirection: "row",
};

const pera = {
    lineHeight: "1.4",
    textAlign: "center",
    margin: "0 0 10px",
}

const PartnerPage = () => {
    return (
    <div>
        <div style={title}>
            <h1>Partner with Shuffle</h1>
        </div>
        <div style={pera}>
            <p>Shuffle offers our partners an affordable and best-in-class solution for threat prevention, detection, and response. They can use it to protect their customers, focusing on delivering the best possible security services.</p>
        <div>
      
        <div style={contImage}>
        <div>
          <img src="https://wazuh.com/wp-content/themes/wazuh/assets/images/2-Full-support-to-grow-your-business.png" alt="Becoming a Shuffle partner will provide you the full support to grow your business."/>
        </div>
        <div>
          <h2>Full support to grow your business</h2>
          <ul>
            <li>Sales team support</li>
            <li>Marketing material</li>
            <li>Technical & Sales training</li>
            <li>Access to a testing/demo cloud environment</li>
          </ul> 
        </div>
      </div>
      
      <div style={contImage}>
        <div>
          <h2>Expand your business</h2>
          <p>Our enterprise-ready security monitoring platform helps enhance your security services portfolio with our comprehensive, single-agent platform.</p>
        </div>
        <div>
          <img src="https://wazuh.com/wp-content/themes/wazuh/assets/images/1-Expand-your-business.png" alt="Becoming a Shuffle partner will allow you to expand your business."/>
        </div>
      </div>
      
      <div style={contImage}>
        <div>
          <img src="https://wazuh.com/wp-content/themes/wazuh/assets/images/3-Flexible-Software.png" alt="The partnership with Shuffle provides you with our modular and flexible platform."/>
        </div>
        <div>
          <h2>Flexible software</h2>
          <p>The modularity and flexibility of our platform allows the user to leverage Shuffle as the central component or as a complement to your security offering.</p>
        </div>
      </div>
      
      <div style={contImage}>
        <div>
          <h2>Special discounts</h2>
          <p>Our partners benefit from special discounts on all our services. This includes our cloud subscriptions, training courses, professional support, and others.</p>
        </div>
        <div>
          <img src="https://wazuh.com/wp-content/themes/wazuh/assets/images/4-Special-discounts.png" alt="Becoming a Shuffle partner gives you unique discounts."/>
        </div>
      </div>
      
      <div style={contImage}>
        <div>
          <img src="https://wazuh.com/wp-content/themes/wazuh/assets/images/5-Increase-margins-and-revenue.png" alt="Become a Shuffle partner and start to increase your profits."/>
        </div>
        <div>
          <h2>Increase margins and revenue</h2>
          <p>Reduce overhead by using a comprehensive, single-agent platform for all customers. Affordable subscription-based pricing for our partners, so they can buy what they actually require and expand as needed.</p>
        </div>
      </div>
    </div>
    </div>
    </div>
    );
};

export default PartnerPage;
