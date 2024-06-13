import React from "react";
import {
  Container,
  Box,
  TextField,
  Switch,
  Typography,
  Button,
} from "@mui/material";
import RuleCard from "./RuleCard"; 
import { styled } from "@mui/system";

const ConnectedButton = styled(Button)({
  backgroundColor: "red",
  color: "white",
});

const Detection = ({ globalUrl, ruleInfo, openEditBar }) => {
  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            Sigma Detection Rules
          </Typography>
          <ConnectedButton variant="contained">
            Not Connected to SIEM
          </ConnectedButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <TextField label="Search rules" variant="outlined" size="small" />
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Global disable/enable
            </Typography>
            <Switch defaultChecked />
          </Box>
        </Box>
        {ruleInfo.length > 0 &&
          ruleInfo.map((card) => (
            <RuleCard
              key={card.file_id}
              ruleName={card.title}
              description={card.description}
              file_id={card.file_id}
              globalUrl={globalUrl}
              openEditBar={() => openEditBar(card)}
              {...card}
            />
          ))}
      </Box>
    </Container>
  );
};

export default Detection;
