import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import './Design.css';

const FormPage = ({ uniqueId }) => {
  const handleSubmit = (e) => {
    e.preventDefault();

    // Access form data
    const name = document.getElementById('name').value;
    const feedback = document.getElementById('feedback').value;

    // Store form data in local storage
    const formData = {
      name,
      feedback,
    };
    localStorage.setItem(uniqueId, JSON.stringify(formData));

    // Send email using Email.js
    emailjs.send(
      'your_service_id', // replace with your service ID
      'your_template_id', // replace with your template ID
      {
        from_name: name,
        feedback: feedback,
      },
      'your_user_id' // replace with your user ID
    )
    .then((response) => {
      console.log('Email sent successfully!', response);

      // Reset form fields
      document.getElementById('name').value = '';
      document.getElementById('feedback').value = '';

      // Handle any other form submission logic if needed
      console.log('Form submitted!', formData);
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
  };

  return (
    <div className="form-container1">
      <div className="form-container">
        <div className="center-form">
          <h2>Feedback Form</h2>
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input type="text" id="name" placeholder='Enter Your name' />
            </div>
            <div className="form-group">
              <label htmlFor="feedback">Feedback:</label>
              <textarea
                id="feedback"
                rows="4"
                cols="50"
                placeholder="Enter your feedback here..."
              ></textarea>
            </div>
            <div className="form-group">
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Feedback = () => {
  const [generateLink, setGenerateLink] = useState('');

  const generateFeedbackLink = () => {
    const unique = Math.random().toString(36).substring(7);
    const feedbackLink = `/feedback/${unique}`;

    // set the generated link
    setGenerateLink(feedbackLink);

    // navigate to the form page
    window.location.href = feedbackLink;
  };

  // Check if the current URL contains "/feedback/"
  const isFeedbackPage = window.location.pathname.includes("/feedback/");

  return (
    <div>
      <button onClick={generateFeedbackLink}>Generate Link</button>
      {generateLink && !isFeedbackPage && (
        <p>
          Generated Link: <a href={generateLink}>{window.location.origin + generateLink}</a>
        </p>
      )}
      {isFeedbackPage && <FormPage uniqueId={generateLink.split("/")[2]} />}
    </div>
  );
};

export default Feedback;
