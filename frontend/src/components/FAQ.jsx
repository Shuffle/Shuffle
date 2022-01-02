import React, {useState} from 'react';


const FAQItem = (props) => {
	const { question, answer } = props

	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<Paper onClick={() => {
			setIsExpanded(!isExpanded)	
		}}>
			<Typography variant="body1">
				{question}
			</Typography>
			<Typography variant="body2" color="textSecondary">
				{answer}
			</Typography>
		</Paper>
	)
}

export default FAQItem;
