import React, { useEffect, useState } from "react";
import theme from "../theme.jsx";
import { makeStyles } from "@mui/styles";
import { toast } from 'react-toastify';

import {
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  Select,
  MenuItem,
  Button,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  DialogTitle,
} from "@mui/material";

import AvatarEditor from "react-avatar-editor";


import {
  AddAPhotoOutlined as AddAPhotoOutlinedIcon,
  ZoomInOutlined as ZoomInOutlinedIcon,
  ZoomOutOutlined as ZoomOutOutlinedIcon,
  Loop as LoopIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
} from "@mui/icons-material";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const defaultImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK4AAACuCAYAAACvDDbuAAAgAElEQVR4Xu19e9CvV1Xe3r/vnJOcBEhBSgMEBaoUK9POCOVmAuP0HwcUCNYZSUsh9xv3hGl1qNippQRE20IFEhQoBJiaKVpEgQRnhD+0QHSmRkAsxE4doBZQTs71u/zezruv6/Ksvffvkn/qd8bBfN/3XvZe+1nPevbaa+/XuxX/Tbe6C/ece8qOd5dNk3um9+7Jk/OPds49zE3uyPy4ST5zCr/y4f+sfxO4j16vHsqfmV7gpgm8Yzm/lP9+km1B9+W2zn/zzk2sDeR55ffy3enn1Lf5J/1e3bb42kX43/Do1nt9fUdpLrSbbFt8vvls+idlm/qsaJPWuNK/TfvOLU44577pnPuSc9PvT95/9szu3p9c/IH/c2oVKDbeyB8z/Yz7noNd9zzn3U+5hX+6m9wjnXM7GqXCHpbR0+PnjudGxEtBkzRo02vFtRB83rkAXPqPGD4MnmWGGa3CDqp9+pp4Bwd2dCwPzIXur6D1xaGRXaQz8nf4Kfix1/3joDXtDm0jHVbYspirbZdkj4Npcv/XO/8F59xdfv/o7zz0A1/9yxEAd4E7/by74OCke5Fb+Bvd5J7unDvGHmyCKiMzX40ByW+XQCxvyoSafgGMBT0fgTayXmA/kykr8PI1kS0JIOMPRiSJ7ctOWfuI+mcw4Uj7lO25Y0TQoyHGbKsjJbqXR5HoKijK6nuz3bPhokEX+f4956Z7nXP/8cz+w//bxR/4H00GbgJ3ep170sHC/WxgWecvUJ5AemrLA4NF2cCAa4BDSCbjYVR2RYN2ZXlAOgxZqcXUDLh9toyvSkybopAJ+KBbOpHADOEjoO1EkVYU6LB0HbPUDtaN8N7TzrmPOnfwry9631/8mcW+JnD3Xu+eu3DubZNzT1Xhu8eyxaXw47lWBIzcAW2fGSpoM1WPgzYNWqSRwqjsnSYokgMyvW5JnzWZNrQpC9tC+ZVZW1Ek9GbBQK8ZuS99mrrW1sPh7XXsTeDmqHrvYvKve+j77/8MAi9E1v6t7vnOu7c7555gaM4SuiHGOsajcV8xmeEUMSDFf4yJQLiUmpYNTg906iVCl7b6ltu4gi5lTMs6Z4RpwLQsVMP+IZaNTtYngRoNI1uOzwdYhJxtEhqKAFsdvoI0XHy/m3ZeedH7v/ZxCV7Vir1b3HP8wr3PBC1HDsog5IkJxSdDHAyBlRqBgyHwAANuI3sg3j4G+shSHASQaRlbZtDW8AmiT7b3TLJD8qACrWrwkclYg2l70qACWow5IZvQ9lHQUmeZ7p+8v/Lh7/3z36NDw6w7a9rljvvw5NwPWykOOuEono5YT8IvXQNBK5yhGnwFVoCgZYPYZgvSBtnGMMkJnR2ZrIh3Fga3mGoR9YgpL2xAjbGlBC2YTEGWJu01J3mkrwYGuFP25EF1XMFj9y6Wiyse9p+/9hXl2il78G7n3T9radomMVphpMdGUG9wAJRLYJ4Wz2CZ73QmUpkxa9jlA2fmKvNz0414Fm+Abw6b+U8D4Km+xfsb0l5E99Z+S4mApIHhaEz2bCAPSmMkaNMzW4Av94ac3vtPHdu96TG3f32evFXhuH+ru8J5f4dzrmYPVGiKN7Bfsx/syVj+C07AA3WQmlYBa4TR+bpWnhYCgjyLtN+OBrbezPdAwNcQCjq4EAsaCEAS8BF4PNIZoBKhWdo9PMO0DX5vbmGTRMi41SgyxrQlTcmsVQB+2jt/3UXv/9qdxVLTre5RBwv/m25yz+Qspe2NQWt5ZEQ5x79kMgzaoTC4DM9SuoqDvcEWSqKsNlnJHYvvQ5oWvRutiInrijdwALGBLZ003sEcMl7DSEdHoGTHyoQ4eqTxaqymzdmYuq40wrS1D5A80i+985/1u0de/LAPf+Vb4Y7917uXO+dud84fRcClIOKdVwPGQZRuNBuj6DujMHakCUCgadUsubeMS1A/vhRLBxZEgR6g8juLbUzAE1tWe8wslv9hh9HyQPknZNpEAsUQaJWPDgpttyCjsDxuTMQMwAOiUoTknNv1frrmovfd/wE/1x4cTP4jbuF+3AItwFe81ACGXm0SAC/5UTYGoSBAdwCwmZE9GAqhInmvBr8JPMmAo0zLB7G5YmdMALkTy/fOz5+NonO0VaJl0Bmyh3jDakzL2xL6JnLF8dGjk8xKDBWPtc3euY+dWT7kJX73VveMhfe/4Zy7ONOcgDpnP+a+iC1WLpZJ7RPhArLCPD7snZSVpnmGkgMZTdIrA5BIwOoHBkDLHWs1eRBMZ/Wr2FWGTcFmGQSMZYhjAInAB1C2WQIlrBGUi1JtUaJ8DHrtVIJtwyjZ6bxKjA3Q1n590y8Wl/uDW9wt08LfFgpmCCgx81FroU40KqhUvNLPYu+0NBSYiBUckjDHxtX0eCJJeqBN7cfh2WazKa/FK4MK+wGmHV/t40wbmyoBj8erYDQ5VGYC1VzFmBZpjUzEjGIjhREO5NS2A+f9v/T7t7q7nPc/qZPbYuhZeJdGL6lIMgFQ12gsJUBxwObLxP1KHujO+8nQZT15ANiOsrRcooZVXjDEyyovAzypbDKNQRifdSZiFXTI9m2JQCNBZcAcv+x7w9iF/zEACwlLZEd6ZZiFmWI7vJvu8gevd/dNk/+hPFDa02rwtXOZdZij8axlUoldwnilAYaRDKa1c5ixizxMVqfAEcUIo122RW2OCwv8/aPSotolLn5Y+nBkRWxk4aQuqGu7GOMxE5nPtQcN0DLggvGGYySjRR3L1L77/P6t/tvOuUc0gdvSZb0qL+hxtbSw/tkGma49SB3J2sl4R0SOBqNm+AYbFW9Hz0KgqIPIgWsCgHhzvaZ9rwYsjgKyzZiJMVmNVoiNsi3oWxi3BlkUwshMW7JO35mBu+dc3LmgwNvUfZVNasfH5AHVX/kOvHNBDzbXfX3jZkxnThliwSwtSswcLQDng7haFVUEWb99umAm6+5iyzA0yDbcntDmhQSwo2U5EvPzI3pWOzzDC/OaLtMm0Pm9GbhVpkD0hheX9hZwpxdWPYQ6iiqMweCgUMizB7nBYtXOeKeo0optXC1Mg8WFagMzAtV62mpKwCiC4miBdcCNSRg2aOnQNSu4Amn5MAi2LGyzoF2aaDtLflfCS2kDtBPRtBVf+cr4Dr+XgMs7Tn9CA86uNkDBr4k/AY0jQ0XRsoIdUqV9NXjLUXrywAJ8Yj2LBYrXovsrqMwI1Mhlhn6xUWq/I9tzTKsT1hNO15dNkqV5VFHAE7bTzpGep/6Afi8jXXWMBnBB2CeGXVUeaNAaYV5kD3IYLP5mFpTwlFSkx9VraWv1m+UYNqB46AL2Q6yf2lgr0HRoDX1PBTk1EliEgkO8dPhcLs+Ba9ybTRsuXmVFLI6Cwgoihh7gBcFx4JohKoli8nAJqGhczbIZQIWsynXCSA2mHQ6Don0YuHYY5HvEWsArMKs6by2Wthml9pkzeWwVilwI8KQPrdJEU/rI+xtsa/SfQwKQ1RRlKL1OLwpph6rAtUEbH5z+Xkm3LyFoOMtXwwkLBO1g8XgeSADa7COlzWqASHhKS0RU0rAwqJwyLrOGCUrD4XFKrtqusDRMefEVsfyaVR0ya17AK7GLrWXmsoxGioOKYXB4p0SjCA7ZyqpFNh3KTRG4LbZIf4vMKXa66hYKyh2ZJfNl3Poe6hhW9iCxDGkjBF6nAJwHi5EQT1hwrrBYYatOjkDM5I3FCxrJxmt9OaDs2oP2ZCqMd2jo6osL7SiJbcww1okCfu+WzNK5mXUjXjZafmAc4Lb2ZSzF1IOlafnzqIcaOw9qc0jnKhD6LMByu8Tbx3KhYiAt0ALDZ9uRqUJiAhm9UPagioTS15ZDkrqIEu0U0WBNW5+fbwDABflXjhMiXSxihDZK76x/I4+t7U3ARR1AtbRCR5mxR4TC1myarYhx7RaWcNkoU8t3KrXsMGOsqInoEJqCnA2F7x5Lz88m9m9FOMpu5LqxsksepfBuaquuAsiXYG5QT6vG3SCf1nVCMpSgGTqKHYqN/t4tCxN+sAjcvjopDvnSRiJcLOOW9fkm6LAnjw0sdryxe9Hyqnhetmyr5hSDNqGarLqxsxWkYxhEkydtyX6mz7P2aaerTVwNtENRT/Rfw6mzcJJu8BC4Bf55JEjnGsDV9bRGI1TdQZUgVVdZUUCyeSsKGJ7bOvfALD6viwsVEONOysOvBTxZTxtTekWDC5aSsixcR5weArcxEVt1qw1lxnVAW/ycSRhgU3Xhwmng1haE7BCuV2XSO/0AKn4QyMWKWKQaOYlrhArmVEL3mQOrwR0v7YX4PBlNxwT1nm+ExiwS2gfEVdCOti0afgTYluyR0my9ZVwbtNl17D1szPk6EsSF1FmYg00KuP0TCTVo1SY3GOo7RyL1QFFop2afMmzDrTgEF6eqbGSE93CBdphcT8tlUx/wehuR9V5UBL7i3rfEtPhQPQu08ffBqQoZrFZ7wHGWbGKNAxnfdeUB1dsMuCZoFTC0hGiHQnz4XGaMuN1jLOVVo8YIeMigRT/lk6Tig3bZIHcKW3pwdxZyxnTK0doDBHoJFM6erD1W9kFJwnFNC8HHcMLbB6NIa9LO5EP+obavAheE4HIvCvkpTKk/WUaqupY4ee6cAkSKrqjzOuzTkIkA1HRIw3iFaUHRi9K4lkRoRhEN2jjuKzpkM7cenpWVChnOFKuK1h/L08J0ngU+I11GMWUeu8pAi5eY/d7rYlahT/scEklbsf1JJNSmx3lv1dLyk1usMBqZsFpesEoFhhqcov1aEgJKmrktqQi8KT9Im0UYDMAeBC1tuLFVR/SNs/mcMsQBsV/WCEoTK2GAvvdDPHI6MfGuIVMcR4XvtRY/AHDJAyDTijBYrCZZU8oDYGATOCTE03BOHawJjDpoOERZuUyUORgJ0/Wa0qyGU2ikVU1rH/ckB9bapmT1TUeq8Xpa0L9evW/zFHZDcil5YGtuv5sYV64mSX6tPyPWMxqS5AFlzAIkU37USZJkWsYsEBi54ECwUiy1EA2XbRY7F0zH6NScNlkayYPVJ2J27QGaIOWRk7JrTB5Qs9UdvzpLwPCSbIBroBtEwAa4OVGc/O7rdjiENKAKfnRDRhcXJNs2JmJQG5FoaTKZZFlgIBOMaHFhtYlYn2lTaWIa4dijUdDSvnhwdBMBJyCEUqheAIWWcG25xh85tkAQMSijd4dpw4uMsknO8EPAZTWVZWJiMd78brAiVjyydboMaZxmaTLi1pLgWgcqI00LDGy2O4GvKV309nG9WGNXaWVp0ZY9DeCx72yMgraSTZ2M2hKOTpJUerSXPSi2a0QBIeQr47ZCt4yy/cxBsnUFQJywII/LwxK3k0BJkn8PU2ZEFrTAAx2NL7HGd1ttxEzDmRbd3znzoHS4x2RygYeYKnh5I3wXpkWM1ulXfk2LqBioQI2xAJ2yMwRudhfcvgHgjoR5fGJiZs32ipHWZYpZWvKAGAUyknnvINOG53Mwjy24EJAQh1w53RWEZXw/Zz7iJIp0eIiOfwY5WgbK/AOYRCvGtLT06KZSKSEa7TP6FoELdVE1TDUYQH/v8LkVWXAcfJxpYxtRiDdYkBJWKWiR90MtHs6ibUsmDdqsaRX5dEoTY8pq6Ms2iSdQBDJAKyJclWc0PYpAZrM0cy7xvQoWTcPybe78yMJHHcfQzt3XsslZ+F02Mg+DABQDp4CbeUbx0T71ThF+CM7Sfw5MxkxtJSdj4xOxvjQIoC0YaO5h6xS4w2382C4MtDzSjTOt5i+bWa0l9vAMk6ykEwwtMUOHlMCtoMjvR40IBwNyeTAM9hz00nOLkUswTE1oMnWs07WPn7dzmSx3GZkWnOaNBmx04+Wgpm2A1pJWbZbX8sDnhRTm9YwtCyj4OCAZojUnjY7ZYtGksI65MmwZ2xHg4igqgIvSMyDU9j4SEhpmTsRYgTaUBsVrbSas7IA6hu5DedoRphWar+VQWUsSpxypQNM7MizbNRiQrO02t9soWl1B0zJNrO8L6b1YeCIC5IimTZgR8oU+iLI5AS7RRqWBRgPsExPjBKKlbZTIG89lhtCpPl7XCk3cGNUmwtM7oa1ffGQ7yur3jjK7ZjU88dMTn0wWsdWD28eFBFD4r2RFkCvsYjJt2yELHEmUSsAFxmqlnhrbbTqnqLCiCNvQmAnVqYlHLnDuyBG1LV6xeJMlyeF0s4XgZNPKsZKBN5gsGt1c0RMn8zSS7wk4/DWAWFQ7ePRjNRTLAzftnSWk1l8RG4+QCLQj0kBEa8HA+ccM3OAl5Rqkv4ayBw15AItBUOcMlk+TuYrBhTvyYz/jdn7wR51bHojQxH+EYyl1n4oEzUcO/tGwR79BHEyDb5NBWr+mtsf7hdv/8/vcubtuc9PuWTsPLB6igTtQzBNsO764kAu45nSK5Sj+3GuP6P2IaM/U2l+24WyFG2ItAWttVO73O+7Yle91O0990eCwHl4mLbD/p59zp3/5ajedPSl0KdKk4XeC4AQ7lhdIQhqti0DRATu/333tkbkxMWuzxopYjHV9pi29hsciGZMkaml5EsshcDf2xP0vf86d/vfjwGXkC8d9BXkAIxxzmFD2iIOTd4Fxqw6TtkgPEpqWd6ABWlF7AAGuDCAmibV1fIHhELgPAnAx02YJUse9tzwdyAx8/jU1OeQy29utcEqQSJ1zryHAlbqPAHZM2+QHoMUBJLo7TNsqmjkE7vaAe+ZU4hQJ3Phzn2nR2M6/G1uxY4G1FATJd/PMg4/ANSZEDLhi2bFRLRU6S9JW0bmwUbT1a9ledUpw72LWuL92qHE3gG+QCkHjEuDW2S+oBBiYiJX74TIumT8C0jKPstLj78+95iiXERGsheYz0+Zbw8+t0kSRPVCgLS6MnUWfvmIAfmbcqw6BuwFuHQcuZzRddjk+gR5jWj03wsVE5b0J9LGdArh6GZezcaMAPDNqcgOmh1i8seVBdAoiN+SoUIc5BO4mmA33RuBeo7IKxt438T40EWvIA2Ns65gT/crkCcUc07iUcSVwx8O7jiujx4RWT1dgz6ZCM9igcX/N7TztMB22LoI1cKuuZHMn40gpLoDXWFxIDcd12gmwoSGa7Py51xyb9NfHI413GTCSdnw9ERyR0/un05Ql3LywRJ9XRkM/P152JAH3heuO29/4+2bgnvrla5wLeVxRy5HHQuWjENOOTMK0NIi4MWp4W9F3GaQCB67MHsQKLBTes7vUBunMQ3vHadMxSg4GvXsRvhcbGfcQuOt6YAZumJyhCfpaoMVkFtuoQM9rm+E19Z7cnPk3ALiV4eCsnjKh6NhK1f1EBkDAmx6fvPsQuOvitdxXgBvSYRJUePLMJeGaK2I5IjP8kMhagAdIa5mW78696li5fZWUVepA4MVVmTZLi+pBoxVi5NyDxSHjborcANxfmidnBLhoPqGZMr0abbw0AE8Ij0fa/AcqCfkzGL5TzYzPwB2bSeIwMF7lxfXqaoCvVVxx08cipMOOHEqFtfEbgXttzCpkxh2aiM2vHNluwyf3OLKiOYwBXHLSZwKuqMlU2obYhnQMZgGgxybAs9NNbLHOR0IXgIduJeAeaty1cev2v/x5zrhxQPPsgmjStD8s/H297IG9YVYCV8uDQoxkQcyffdV5BKbjB3WsxpYo84Bmp8ZELK3E1SGa17oX7ryrfnWzydlcDjmBU6bXx8L6d9KZB30KgVGB1chbWD4L3LCz4/a/+N/dqf9wQ5QKa+9a6JwHkV4NU16S3Y0a8GAaMUwVuCZT8swAZNnsp3lCxewUwdj8hhjeo8THqbw4gTsw7q9uJBX2P/NBt//Hdzvnd8TIGlkUGG2MyJGf2FhlzMerBozBKDeWzSmvYvATs3H5fL9w04nvuP2v/qFzB7KemYd4u2BmbAkYnoBEGw1wU5JK8NO4ziXgdlbESKfXYloCbLyF3GbajF713i0A99ydP+v2Pv0O5xdHe6dVJjvSyJEmisBJNTMm52WHKKM+06S7dggyixaF3yR8s6+kCPBmgBR2nyOXdNogB8TGxpWLwIk9ObbY5lRAlgWwgWXtiZ4/+6rz4bkKVe3wF+vMA2ScWtKWjISFuRVmyHYaybQZKNsA7kfe4Pbv+RXnFkcLVzFi6hQSxUhisaI16UhDM3Y2rdKbdGDtzxw0xqwbCSTbjh7ZBByts/0+NgVMxKztU+Raf/aV5xtTMdn5uBrGVEFrIrYFeWB++G5+71wddtV7NpIK5wJw35mAK8v3DEZMA58nG2nRT1yMQBsHqSCxOPTIZKfBnErLcuCpw5hDA0bqaRv73xRiBPhauGD3oolYm2kLb2Hgoh2kwjtaTKM+Kd+fiMUBHWDa7DlzrcLVmwN3LwGXj//IwBrn05rhr2r9qi7QbmM0mPF3+S8l6iEQgN/1o4hk2SAXmAhCS/v2xgC52qo0s3g2IQ2oaTURAMaNg1ZDEjr+xy5xK/dZIR7+nuhF677S1awDF9sB7t3vdG5nlgrFl9WuYXnuQf5ZhypsF8p69SMo48Dg77EkSA4F8f9nabaSQ5Ybx9tGEbhZygsxLRkTFuoXTgBXG0WHGkvTJb3aK5hRo03ytOYZXgBUs8a9es4qvEB57+gvzn3oDW7v0xS4IzWnKGwnPrRCaJa1pX8UGIjtKr9C0LJBRPcLSYePouJba8qLRqSLiL6pPbimRWIK4Ccv46LzglURV2wfAS7WtKU/JhOSgbS+hlhoWDaa7Etqnm0LALU14L7LuZ35bAbLIanhJSAIyw0fgTrCZhq4kTmlHTDo9WmSqG9Ivo20zXiWkofSmQ09mw/0s3aRM8+tkTkBV4NWV/J0BrZ4HfZGrYdEOqkl2hGo5rLGq+/YjHE/8ga3d/e7yuRMM7UuYuZ6UYQy9gCuac1zvBh7WkzbYPSq6dipjkUi9E6DDG1GB093okjxWS/OcEPhHWMny5m0uFDmrVpPE8Dmpb2zrzwe7s8J8OLZTLwAMOa/q3pK5Mn8d7HB/GuN8L2g1rd0KkzONgRukAoIuDKKWBMxzD5kBFJN81geFIXakvJCMgR8kagMSwyoA3o9AVd5bT/Er6tpS1daEzHm0DJn7mepcLzkcfGBxRZoeceK90jW0TMY8DmmTigjMqX+544776o73JF/tInG/VdR44Y8bp6Pyn41Io2haQNwm3laBCokQyR4CJuRd8txi5UFDVnB0D1amogJSZlgRtN8fHD4Q4NpG4sLBULhGXihpwAXAg/qWq6rasPHmTY0rCUNwt+VHha3bB243NDJ8NDvOkxWl2/HQaHfg0Ar5Yd1mLU8twAAiICCk+34Mm6RI+UBtM0GaAcWFyo+xLluJAL7s69IUmHVCvho6UQufdCqrSGmR9qGK4M7/8diS8Cd87ghHYZDIyO2sp9JOxVTVi1Q2E6biRpuhwK7B4ydKWPAG8vTctaMmjL+DoIWEh1dc7E+jRvsGRWWsJ0ixvQLf+YVxye9ImaHbl4sI/aWQaaMQ1oOVG4yrWaZ2Bu5fy3uOTvv6tu3IBVmjXuEgSWHXrL4l3CJQZG7FM0vWUKEdzXiI0X0KMqNkIUI18X266W8eqfLNORBdMrBxQW9/y05CsGOP/OKC+qP2GPqoKHywrU0LdI/NijCWEvA+53tAPeeOR12lEoXcEJ5Z+8ca9s4KKJTgu8tIOcmYwPly0j2YF15kDSz/owtGUcdQUsE8Uke6HYjohqzHwCuwbbprYoBqb6BFpWrYsZkpxo+BwMSP9LginMVtsG4u/e8y/mdo8kxrLZhRwunby9RPW/HCQsJH6nzGHXSjwQFYe4MdvV+zszxMrmZjLRt/tMcbZpRsO7EXUEe1JVXrmmzr4L5hJ6ItTIqFbjaY9TDY/+6wCtQDl8gJ4CPf2D3hzkorBBS+5zEe7fCuD/ndu95p/M7x0S9MAkjFpNNS7d4zJPdzt9/bu3T7KOwLh2Twf6f/r47+F/3haL4pKdY/MrprCpFqGSa3M6jv98decpzNDbRGJEFgtAav3DLb3/d7f3R7zq3v8+iKm3EWPUb719AZ1oNaxaoZ2UbXggmYooI63v8mZtnqWCAkcyelUhuMi0qlgGgbzgLazNcgNiGVJiB++6kcQVmgvUbNRkH++7YpVe48696q3MLq5JKPFP8eOZDv+B2P/HuWiuBpJp1ntbBgTv67Be7C69/i3M7qKa2/e75r/tf+oI7+bYbnIM7IKwNBCgSVPwwnGgnVuWusZVGbXMjEvgzN18IAjzXHqsxLZcG+Ulzco+ZEoKWh7bmh/22xrgWcO0JaiCKg3139NIr3PFNgHvnL7jdT94RMiT1H9J98XcsVG8FuJ93J992o3Nye3oam6YmDY0BTDs3NLCttB+aTFbQVvLV/VdFTnOMJsCt+kM1qK17uW8v2qtweQigHqahEL0zh9RlYMnzrn73hlkFi3E7Kbm57csDd/TSl2wZuEqjJq0IjrNaLt2xZ7/YXXD9bRsw7ufdyV+8MTJu2eWbVYsBPBQVEgCqRGg7fdXUekVMbEXRGj3PgCDjqu81IG+RjYvyIDhiU+y3S//aEwWiBefNktfM6bCf6MdE44qzd/6c25ulwlxkk/91qvZL17YOXA3aktaksixT0/JgY+Dufenz7tTMuEQqzJo2t4RzC2VCDcxqlzHQsu/NjdieXBNwVoFbG1YAaIh8rImTrl0RtPFd8pwyoIdpYXM6V+H8DYF77s7EuAW4/bLG8g2xgz139LJZKrxlfY175791u5+4vTqOsJ0KStSpZscJGndzxp13+YZV2qGUGp4PBWnQ+E6IzbJ56UFKBPAeUhdTgFuS7ubhutb+MKJTVi1NHP4ehJvcNH/KkhLjwm0HuDNwZo3ZTmGpAvCDvenopVf441dvCbggBFcCSY5MkbwVxv2CO/WLN6ZjRkcKgYxJPNS0gnxK20HBzFSSOlrrV/FbF9YK47ZOzGvSONq5gNhyYP9aaKBhGPSpoa1JhdtxVoHurxNGDyYJk2tz7OsAAB/vSURBVLOXuO0CN/afARZOYn18/49sxrh7X4rAnaXCqlvIWfYgTci4IpMMamQOGDABdkQFXH6vP3PTQ8J/K+8ugM3/oTUte6dmjPhIAMbxw/FQnWjacBiAO0/ONtW4beDmEKc02ZaAe+4TdzifsgqqOi9EgTpnrsCYgXvgjv7I5RtJhQxcfSCI1NvAoUJjVpMHHKMD2YPUYVjuGYBL8ixjZ4jFnQsFq+ZMEzeueE1TWiQJIq4pTfWzVNgUuG+Mk7NQq1AdlEwyZ7fzcCKxJeDufuIONy129A5qsxY5te5BAy4GLZNpiWFZDUkGsrqwSJDQ8Dj2CBeSbWuUVlp/ttbpxLhwwhXuIIdDhJeinQtISAPaR3uKoDzQK0nqPIfFgwFcvn08GszQfvPkbAtSYWZc7jjJbnq0+KpjAO4sFd68QTrsCyEdNp09neBmT5BUc3A9bVwJJUTIC2YGACtIkL+3gjkBdyTdRQYxOT37Liz1tMZEJ1xmMnRhWRIfa5gqr5j/ujXgzlIhTc5KDUB+U6PgYzlr3J/eWOMOAldvbJyzChsCN0iFtybgijwuIrIwbO0KrwhbMidQErTnkOnvWjZxh/ZnbnooOLbK8gyZ8mrk7EgDV9K0XAixmWSEU92efv6179pQ477R7d1N0lEJryXlxZxRhLitAfc9fOVMTcZQfncG0NIdffbl7sIb1mfcCNybuufjlqE0vufMCEVEqQqD7jaihHFAVEBe+NM3PZT7AAvd6XjJ1Jj2woIV4kAtLayN0BOx5jljs8bdMnCzCIOaVkaRWeNeNmcVbtsgj/smFxk3Lfm2zqbN6IjyLWUVtgxc5TTVc+OhlpKokFPpjY2McMojUZSv72CA52QWoo8ALvKKGi5tabBd0DIBb0mLLQF3lzJuBgViWhHi5lqFY5sC94MUuEb0YrGWSJeQDtsicK1PmI7kaMsYEaxIgDL7YdByojIiTWLfClzzXIFYexAKpUyPLNICa9NWo8XWaAXaYhTR2ZBVeKc78vQXGDWxCn3qF2c/9PNu9573kHQU0LQgdIdfHextEbg0q5GbifOgpRNbA+7N9HxcMn5pKmIc86kKX6BE6KS8yNhq6du+NwIXApJQPllNYxNGqjkJLAZPdIT7+bEexmFq5wee5fwjH08OZ7bCTz2SiKJ3ef8fuYNvfCWFwLHK+zxgoTrs2T/ljr/830SpACcdDedZLNzZD93mzt39PlEdJvpqRYEHB7iswaY8KExGL+8WzOBa7snn3WDkYf19c/70jQ9TJs8aL8CgtQQsdJ+tS1AY5Cmv6Opy/1WjdmC+YVq6sAuBnQkb+m9W/nPy3zHOh0XSR0wapsktHn6xWzz2B5PBUR/xlp/c14Nv/E+3/NZfiAHtMG0miwLcf7d2OmyenJ18682yHjcCqdQd0H4hYjDkgULViDwgTtuM0s5h4M5LrIVarQHBQr28r/wHuF+xSAVFeS0I0ZwOeEhlK4MwgtR2FNk4pUNJupqW31suD1tn5AilvliGp3aZdz6UMuU2KGoT03VbAu6pt97sptOnnMulIDMXhNEfmYjNrZJVgQZexNYkKAnNRRcWzmOqmDJu2GqjcpmlIVX/GFVEbKwa8kOsL/OcdQvwbEeGNlBse1sbccdCwG3v5I0mJO+WABU/g3DWnp3nMYISgbRtTseFydlmjHvqLTe7aS4kX+Ro58O2myI/ZX/LH7g0iBaZK8wkCyBbrfE1SYZLAdyyKmbStAWKKHrCbU3gSS1Iwm+hQQEMaDgRtoutbNCGx4+cLsNHrOSRi0Pn9nQZNQ0kG8d+2aSbyEGA9F5JBFsE7vLM6Tj0wymvyLQQ3K0QX8IikITMYREG+OnvgXEZ05bWIMq3j/WpTGaFCg7arPO4g7ZFeQQfB20FFAItZkedp+2UNBZ/bLN5LcgxnE+xEWpfo7yQ3r8/55G3wbivcMszJ/mh2tLZGEJr7UHdrNifTEWUA8IJg9o/LkrWCvvTN/4tHuFb+tDwJh5+EXA7tQeQxfSg4vNX03UtUORPcaDySKPgw1xybEUVYTtuWIMIGNMMgnYOyftzHvlFG0uFk295RZQKQ5qWfCTRlGW5Q9LJUZTsEEF6lC5wD1IhAreGUmDgTUsTxWDzAe3sps0mhTXDuWf2RGLdc7zyE2Nbx5jW3Gbf1X2tXcIGAAJwZ8Z902ZZhRWBq+RBq28getfLB2RTmtNoTkrAfXBWxDTLRpiBjX9wCZgP2Nhp19rbY6cNYMBdqsbEwRogoemVUw4yGYvO5YeGNJuBe+nl7sIbtw1c5KTcfpHpLEnIJ2M4cqH79fNaW4n8qRuyVLBZi0646MCYX8UJHQOdRYPY1X0MSPnqmK5p3FvCCARu47yEpr4jjhFFespzG4PYqz0IjRxZrROyaX7trHEvvdw9ZKvARRmAdfO087hlIxGjhgpndu4UlinWCefpUf7UDQ8Hw6+32kTT1Y41WZrkgWvTpcbphIrQcMurka6Vnj7OtDGixfvbkz09sLgQSAMtRxvtbBS4Y5ovtHcrwL3XBY0753HpsRcFEegAv4GJWJJ1Cp+43JWhOyaR+1EPALc/O69s1piIJX1DNWLpCA4zbLUrhwndeStMcaeK9wk2E5OnAiZJAErTin6mgWX61wzvQr4U3bfaEnO5LdZGuWl/PtfhhZsx7hcTcOmBIAC0tfed3djFLiPRmzt3G1MKk9MgcEd1aUp5FbShIzQbbFRGx2LbwRAPswdtXcXDToNVBPhVuGrJAwIKrWn7bJuLnIJ5Z+BetiFwv3SvO3kbyirIxQUEWDGOsW98S1fTmTm4cQTHhBHezKTCUPZglGUB5ff27TfrIpA8qMbralriFONMa7ElYfciLwZmySZwkbYUAyvD7IMGXJny6kc4Kn/gbmHm3Qg/0XZas9p2qcCNoCJ6A7GsxZYogzBSMENYJtCI8ZGQrD5Vz7g8MPeHgfsMI8X+lz9iTZt/S+ZncpZtHB00lt1QOVWk97cB3CIV8p4zuRo2NvunCwt1REc20/Lns3qTKteSmTngE3DlZAwclQ71YZoACRT0vU47gK1pG2F7marDMjHmdhjfHGPNbNQf11qKaCwO0NGJF2CWhsbO1VjxXZbEEoXkz7ncPeTmDbbuBOC+Mi1AiOyBOd5AvxLD1v8cm8TJoaPRsHUclz91wyPA19NX1LTp7XqyMhY+zexB03gLt/P3nuUWj3qiqsfVbNrKO1K1icJY7yw0cr/Z3ngNGlTK3mzQtAhOD8mctnRHvv8fuvN+9PK1tw7tAeAW3+8dElO8mcum0uyhVOBIsQ0niowxf+r6R5Bxrg9KGx7SL+SA6lpauL0dpz/YKALQVrliHqocP15y/rXvcEef8eMEuNZo///6+zknip1tpMczcB8gjFvm1D3QBS9EgEUTTD4PiVegKjIRyTAJhM8czM8gwK1hkdODMRlT4UHOAC2D5t9bjcfF19Qxwgx0seOOX/ef3NGnP39kjA6vARYowD09H3qX9G1vAl1ChwRuf4IZNVej9LExh4mvjRGcABeB1gKenIiN3is7ZkzEWjpwbnzu3CFwN3bGCtwzjT2FGJDG5Nb8nkQsfB2v16WdK6qEOJU/df338DlL+cmQB0ysjeZpqdbtZg6KzMqarzY8d2feObBwx69/xyHjbgDfCNxX15WzFuMJQuGXdspRy8fJwcQut589kF+HahYKcMt9kPHQ/rCkVZjhOnvEkr7hE5X0gEaICsAtuZKUZzwE7gaQjbcG4N726phVYJkYnBExT3TshPiYo1XPjCnDwkpC45beYUkZgNsG7fyEWgSeZ3XQak1RbyWZBzRtQTrZanMI3O0CNwIrwUjOVxBJjeZ4O9+DMCN8axK3cP5klgoDTFsEsjRZR5fm7e9aFyUvszw2r6aEIxNFwcchcB8M4Or9dDwnzjdSDkymmh/1E7KTqoaQ4VBEWHPN/uR1WeOi8BAuzJE6PXcke0BmnKnaB8sDOzyE64s2AitOM3Cvm9Nhh1mFdRFcpEKpDuMTsUi/YvKd5V5Dk4ZLzOq+fvbBXowqkX/yJ697JCBClKcFIOukTnKJGvWkYuSBe+MbQWndfO9iBu7bD4G7Lmqpxj192ihr7JcX2vn7+cSLxlctgSwpMlQhkhBX+hsGLqmuMjVtL9/XqqfV0qJoK5pBiAlxWZqYPPYQuBtANt4aGfc1sB63eeAgmTixRoTBG015oWiL7tWgDXdqxm1sIS/UiXK86+ZpReojhRnItLRO9hC4WwDuH8asQpYKhFBUuktpPYyBsXMVNGj1uXQzYOf98hK48b0EuPZO3Mh86V+Lac2Om/fy4vFinIHdrmFydigVNkHv3hclcOVqGAFYayKW/ja+L1Bo6QCwsXWD3F8O3NIAROP9ukxW6Kws2ikCL4YZAG1oXlqAeMbzNhm7v9H3BuC+ec7jzmWNqxe8yPmKwnY4WD/pXJH2yj+GSrgBTcuW/CvjysM6UFmjLQ/Ce9MXCWHKC6bLonOklEVKIIxuZ5lv3UmMewjcdb1vBu6JN7/aOQjcNN4dps27eHNMZYeENOTFKhMxtO3fn7z2UbF2wUpvNEBX1IN5jb24QCdh8TnDoI2zVb9wFwSpcAjczYD7mnIgSJWE/ZRVwGRvi7qBKRu0AgcN6RmBW3K1eMWEG0auIxuyIkposB+j5gXjQf3W2bJop3ES5uHR3h37x1e6nSc9DZyYWFsMI4BigtbQo0hDrjdf0LlPvLI4cvl9inrm81GbV3inX7j9//1Vd/Y33++m3V3yMMS0+rm5UgtiwyLBzGOQ6FT2IJlE6u48OYvAxVvBe3WZ4ECN0JEeS5cjkcaZFgt/ckynFdIMbVXb2dDUJaQYgOjaZ5UyPvAOfUhfncwa381lDjCSsmShdhC0LaYtDcA2w6fao5SX4SxpTBLjVhasHlQYLzelLAdGXYruyUrHSJUkULMshZWnVYRinPAnAbv2hk8UbdBhHbbWz85Qm8RCrmIQpd0YGOV7UPQiX0EKl4/pUnMi1tKzaexKmGfjI9+7yvjb8oAHRm5L/8C1fycMNWvzgKfKWR4AvIBeAnprGRcydWlw9JcsQWqvOCAAw/L+dfZClft72Q3ECLmKDYCuGYmSqXofCmGDJPaIhed3nCq2obC2crBGiI9OKckKOTtxIIIALC2a516QI/bpe1IxeQFuk+IZ2o3UyUCVVxMU7WqjYSMn8Ofrc8ubmqwYuKG3ufuDY4NybYX8poE2ugwmwfTLRjpKvXtkN25+S2FDnTPXJJADcRFJNfUzuoVcO23SoqLbTdCGHsOT0ZPzBMYtT+zWD4A0Wbm5X0wcL0XhV3upmcxuhbOWntUTxTqQPZbtMVFiI9W0DIyATJzHLhFEaVZiE/Jg9n0OOjfp2qUCipFATx6UXSfCASm0KQYEPNdg2kju1KnyL4gNI3DbIZoc1oAFdy97UHWIBC3SZMjAeBCZRiRM25cGIJxB8LbbV8ZuKC3Ebcfw0vrMKGHbsQOpcd/GisDB+LZ2+7YcepoZE+3kbDOtiqyl/7xt/oFrMuMaHpVutLeQG3oujWr3fFrGJo0Dz1i4lNKlhkXNeiOatqdnRdilrNLdxo21cHhEAqxyNPb8GqWKmjOjnLBLKnipcon0A4YHfn/zIG1jPMpjIRl25YFm2hTNBJE7/8A1F4Mu0A5IQU4eMTMNt3rNPLCnji4uoHc1WI9IgzHACjYKN422TTNZ6/zWGu/sKBW/I0b/YYek8qACo00YuHjfdnjZEnQKOLtGyLISfQygWcUy7D50OqchXwFwA0OFlTyac1Ne29XDuUkjmtZyDgO0gnrW0sPBwAi0CaCNMBj+1DrzoTJibmlRS6FH6SMh0NnYSNZJWOWHAflCSkohm7dCvLkiJhwFMKpdq4JLE3larvv8aMv0XgFcoi9N3TaWdomdGGWzkYJlwnjJ8Guddg21rGA9hShp1JEMALGlpDOlaS0mlCmvEdnTOenSiJDFX/KsnaVIUfvqPsfqazjXrKKKkIfx7zrKS7MFvihZBSoVClgNBoThgQ9q1rRmPa0AhQYf8jwNWjOP3FvNCr1HTsWYLDElCPOwQF4OrL4vPBDmaVV/p/q1PLptCjGtHPD4s8nkHabNk2x+f5vh87W4ymtuSv7yH0+X1qBpSB4gYPOhiPMd/oFrHl0vWW3XQnKI2jH+Lsq2yhNDu8eq7PHgFPzVsGzWRZRLWlGAi63ctxrq6945khi326bat+I3xCog4oJBs0CbpKwUoYKQrrfbrH0kUsEAbx+ahAlbpTsZBqwon3CZ+8aBS8IvoujxlNlIyqt2ooLdCpc6TGvQosUP9LyR7MEoy7ZBy9o4mO6i0qrYBQJvhGkHGDqFaO0U6Pn8d7V9KLdv1x4Qh4yRv6TMjHrt1H9JwJVxm2wLBpPuww/3rjbRWSmcEYkC70NhhWkmJA2yyxuhqjCCpemlfBGSKXs/BG26l7e7hFXmzEN9Q9KuHeJrFBqRFlj64AnqGhOxVo2FOPC5sO4sFXDFTnsJN8X69P8MYIwUvMBGE6OX2DdUZKO1aRl4EAkUKAD4WqG2OlSRFJxpUXi0IovczTwAPMFG8Q5iJ9Y/g3zUSeDyvei+egAdj84StMiZAVEwsZoB0d506R+4+jHhNjWGAyFqlcWF+I5sWrAOTVi1yM1STs9BW7A8NBFbLRLQd0cYGA5TjKYHJ7bPp7QXHdoUDpkQBSmv3kocfzfW3C2nJJqRj33oS0yGln/1PzNLmSWmtKsEP9mrY5OovaztXDHKtaJrAO5KoE0fr4olZauBYizMa4/nHYdhVqRTwjX6OPtsuB7T9pwWOFkBfH6HtbgA5AH/1YA2Je/v34s0ewMUzKnKvRGz4X87KS9hG9i+YizM5vYnFeq7/YnEuIzyjeR69bh89Xi9KvQ6jWRwYLAd4hArVO2G5Mto+G2cd9UDbSt7oPoL5AGyidLrnAVjnwf6BhcXkHTRNsfFMgAHUB6OMm0FZjUDllYAuI0kN9NDI9mD+NLciLi1jRReIBC0PHY4hIa2ZV+p+B5e7QM6jMVUNLC19oCRgAJd/Kt50Am7WbeD6gI1uAz0oI2t/rfunQtmwuG2vGetZVyTafPOX4O02gxdHaACN4dHFiq0J8cHj6SV8ApOWEk2NFQ1DDvSPw50oy6Cecfgd3vRztFWlRt/B2A8xbTZkJIJQS2tKrkUoAPSpUaw/kdCYqTkJMJY2nDKONaWdLFTXuxxQ5q2UevLQnW1iwYu8vgm06bOKQ8ywhnybK4j9P63XmV/eaZRFyFOHIyjIcGxWlqIRBE3rZCnpWGgAKNhu+gwDWnAUaIK3MOjW5NYk2mj45knJrIP9RrSQmLJkEH1cEN6Q9t5/YmrHwu+uiPYsgkMrEEboSK1jmuXOKDohHNDwCsmGK+LoObJA6sCjXo+b0cBbm8ZV9iO2iW+UzKm1nTr1tKaac6OHi5jAYGW7Fz+xp2q2pHay1pcWD0K5LEDwK0PC40wQWtV9MuVFOQ5PARV+wCQ9lJe4eYx6aJZdmQSRtpKhXMALP+bFX5nPZt7phzaYrz0ewpaBQqTLfO4rTYWNYokDLDnr1lLC48oWC+K0MDsT1z1WOFXtdHRUKOgiIPIoz7SR5hRIOP1QmgIg6PtE4zZ+kq3ofmyt+McrdCDpEMZuNU2I1VeiI0szTkie9S9Kl1YzK1OJWqDlvWLhbNGtBRjq0jAZPT4TAHcCrT6XCN7QAaXhnkOQAlcBdry0eJ8XzwkZORbEtlCxooYawgIZ0O6DxveXFxQepO3DYfudkQaZOiMnWiU1m7cFkuPTMSgZpbRBxEWQfSwZscROHQ2Mi6XB/E06YZm7IGicYJNNGxRKoMrdmhw12daXR2FmMwA7cBELKJI1tKO1THTnQv9KKSjSO5bm0C0/MEZlb48yPKI+cNgLTeTiL3oKivEMnDDfeXMA6QbLS8aKQLnTJvDAjVu/O9+agfX0iaF0tPDvS8agvBU5QHcQp6YTh4XhTTtWN9wcXznKKs0dmZtc4NlC49AsJGJWBgg4SiWxlcgrHUvhpSs8tp4pjzbzp+46pKI2fIyYxm3AQoVzpBGJBetVYeL9SwEDpqE5ZOyNYvJAeHRh8qg/KHoGvSkM4O6gzwQLUZpRCBcoM2lT8jHkE+PMyZDY8FqU8K9ot5hlGll9snQtC1p0LBLQbOqW/BBKuy5yR+J/VsNtNqx2qmdzLRUv+dQAyoqRE7SOqwjhb2WdjM/oEKBZ0mDOWkhC2aUVmeZjbYu5WE6a1JoS0r3xWjCscKNqO2N+UUB7np1B2U+wirR1gCt6p98hlkhtu9PXPW4b7tpekRT0zKkNcIF8h7GtMjIIzNsJF0QYPXzYzgxjFqkifH3/pFIOfIV4Cq2Y4wn2iekCTNfb3m6PHcctKSxkSda8kA8H0bVAjwLtLy/MdLSVrD5jviDPMaUveM7/q+vvOSPvVs8BbKgYXTaibJo0GC8ONlDE6yG0Zk3GsU8LO6DZ/U+WWSyVXw5XhEjg0HkFQcFmg+g/sdnKUD1loDTuJgLEx0mGzpdxgSu7EefaSuMUKQyMJBsC4nATX/iT1x5ya9PbvFPOHA1C+Iw3xggAWRFxpss4w5M4rqrRg0mDm1dhuR9Z39ZjAR9aQAijZglF/t3J5irTGKN6KgGo69p4fg39ojRgvaIJp8OLGQCGy9RJ80OAR/Gxt3lT1z5fbdObnqzc24nGs8GYx98yKMQ23aYdorZ3FW2tzOSaR7rn9+NBrWeeaAjEGZaFZTW3tHRtn3tHxofdG/pXyX0FGH4OKI8eLxFRgK2JG9Fq1aUUwDSUWggihwsJ/cv/Hdf/vhnOr/8qHPu4hgf5ek0cjWsYaTc01KUk79LSJiLe2m6gwLeAm1nwNLIdpmWHLNJwVls2tuNG2yEKrySXTqSiebM6/uxw4PsCGcuTjRCI0rHRPZr11PX4VxNHkA93LJLrv6DbMGwMV/5zQO38yL/zZf+gwuPH/nrDzvnf0Ks1zIaV1oDNYTpkrZ2yTgrnzRkz1uvYGbsXIDarvzKIJUhYC0WHFlcwJqe+DYZprYmDu3s1SIb1VosxFsSofzekBalpfZWm6ipetucgGRKztfbfl9OsHHut/z+4qdDS7/78u99qXP+Pc65Yxz0sSNDoE254AACMRELv1tb044zLawuY6Gbgza2Nf8z9ogpLSCWcY1CccaWBBiQjdQ7BIBSWM6/tccDkYVle1lPq+/lZx5YoENLzOJawzGi5VEtLopA4Xf7y+Xy2ks+8bvvCz+duO5Jj5x2z/5X5/xl5WEEwbbXElAVFEiwDyx1lo6tybRVV/FwaUx0FPHMxhs6gC5OxBjghx3SIAEGWgC8BFrYZnBvNUBiP4tljfcqp8g4MBh/nJCAY8C5iARt/dk7/wd+37/w4k996i/Lb7/7su/7p5N3t3vnLmBbnLmO0uHNMF69cN08rel1LCjEMArYoLPSZ8sDFOLn5wNduwJo+8BDfYjRqzoKsom+rxBNC7Qj42bZlkYpJg9J9Oo45CDgaQXb6YMDd+3jPnnPh1iPv37dYy64cPfYrzjnXtY3MtZk6r6B1I5Re4DBSIuByASQIVmFbhQCE2u2CmaE5t460ypjaYdpzrAb4Xc8T8ulU462SkJpQJQQr1ROpwA/v6OpaUHfls5/cLFz/vWP+djH5s9gcjF64p8/8UnLxXJG9FOZZGANbzMhCzWtwWnJgx6TldoKCUo7zJSIlw6fy8u4ZmgMI1KlQR2gxrI29SCyvq4Y07Jnjm6TONpARj0hy1jfeCERkU60YCZlqFuTqdBhrJlRJVlvgSk0hETGYXKMfb/3YOFe8rjfuvvPBKdXi//VlY9/rp+m9zq3eEL4bRO03GOLPQeAZzItrgnlH97oz7Dh+n3oymD2II64XFxQg5mAgR1GsfTAwgkFhXKqBuCH5IHB0uVe5gHtmmgOPBSBgYQhwBVREnhqtqn/2r7zV37vb3/qM/Qe6FLffdkTnz/56e1uchG81OMZmEX6I4xU6TDxdjmwjVpaajz53sJIwp8kI4msBgPQQD1tbAKo9OpJnzSaYwdN48kKH1Bh+x7wFI3JzIEGUxxO2pb26TJqeMzic/7MzLgQ8AJT5B33T37nlZd8/JMfl3axYoH7q5c94TneTb/knH8qWk0bK020JhNrFIH3wowxqNUIMXOg9JsaCSYPkr2xpmfGFO9XA9Rhy1iW2JM+OQbWsynCYyGTCdACeaGYlhCDciBgf72ShhyDE5mKIsz+DOz3Huy4Wx73sbt/DzmzCdz54u++/Ik/sJzcG72bLnfOX0B2Log1/E7Kiw1ae7WmNrKChXYWAg+AgodplO4iRi73V2nQ1qVigIDTMFA0QFsYT7Fley5RSQp981fWHuhJWPwNjZhGuE+AVc0bmoQlO1kH62HQnnaT//WlX77pkt/+9FdwBMKFnOzasLK2OPmCaXKvnpz/Ye/cUcbspm6JhRWZIzbZiavDGQqhIPTmy1bMHnBjDUzGoESAQNDnma37OabmMmmZiCX/1cDlQ29p1M7ignbIzBfRhKqQSIwRd/hdN/nPueX0Tnfs+G/k7MHawM03PvDSv/uofeee57z/Se+mp03O/W3n/E63AJywmQIE8wAGxmKAsXwfN0h5ZW8ixt4PFhd65YUEsCoSaIrSS+jDs3YOvPCuXi0t6xvhD1R0bk2m4a6KyqIqOrIBbh8TmoB94Jz/lp/856Zp+V+Wx93vXPLRT3/bAiv9fVMqoAcEBvYP/NByWlzm3OJZzk1Pds5f7Nx0kXPuCF7qNHbiio6q9yWDKr0IBkXei2sPLI9HW25GmXbFLfmFiRIALBsA+VG6rYEGvrWAn6/8ySxNRCwtnmmtpqVFk8i4lZC8c3uTcw+45fQN5xdfnvzyD5bTkc8e3Xf3XfypT50aAWy+5v8BUrIHNHvQF7oAAAAASUVORK5CYII=";

const OrgHeader = (props) => {
  const {
    userdata,
    selectedOrganization,
    setSelectedOrganization,
    globalUrl,
    isCloud,
    adminTab,
    handleEditOrg,
    isEditOrgTab,
    serverside,
  } = props;

  const classes = useStyles();

  var upload = "";
  const defaultBranch = "master";
  const [orgName, setOrgName] = React.useState(selectedOrganization.name);
  const [orgDescription, setOrgDescription] = React.useState(
    selectedOrganization.description
  );


  const [file, setFile] = React.useState("");
  const [fileBase64, setFileBase64] = React.useState(
    selectedOrganization.image
  );
  useEffect(() => {
    if (selectedOrganization.image !== undefined && selectedOrganization.image !== null && selectedOrganization.image.length > 0) {
      setFileBase64(selectedOrganization.image);
      setFile(selectedOrganization.image);
    }
  }, [selectedOrganization]);

  const removeImage = () => {
    setFile("");
    setFileBase64("");
    setCroppedData(defaultImage);
    handleEditOrg(
      orgName,
      orgDescription,
      selectedOrganization.id,
      defaultImage,
      {
        app_download_repo: selectedOrganization?.defaults?.app_download_repo,
        app_download_branch: selectedOrganization?.defaults?.app_download_branch,
        workflow_download_repo: selectedOrganization?.defaults?.workflow_download_repo,
        workflow_download_branch: selectedOrganization?.defaults?.workflow_download_branch,
        notification_workflow: selectedOrganization?.defaults?.notification_workflow,
        documentation_reference: selectedOrganization?.defaults?.documentation_reference,
        workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
        workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
        workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
        workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
        newsletter: selectedOrganization?.defaults?.newsletter,
        weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
      },
      {
        sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
        sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
        client_id: selectedOrganization?.sso_config?.client_id,
        client_secret: selectedOrganization?.sso_config?.client_secret,
        openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
        openid_token: selectedOrganization?.sso_config?.openid_token,
        SSORequired: selectedOrganization?.sso_config?.SSORequired,
        auto_provision: selectedOrganization?.sso_config?.auto_provision,
      },
      [],
    )
  };

  const surfaceColor = "#27292D";
  const inputColor = "#383B40";

  const bodyDivStyle = {
    margin: "auto",
    width: "900px",
  };

  const appIconStyle = {
    marginLeft: "5px",
  };

  const dividerStyle = {
    marginBottom: "10px",
    marginTop: "10px",
    height: "1px",
    width: "100%",
    backgroundColor: "grey",
  };

  if (file !== "") {
    const img = document.getElementById("logo");
    var canvas = document.createElement("canvas");
    canvas.width = 174;
    canvas.height = 174;
    var ctx = canvas.getContext("2d");

    img.onload = function () {
      // img, x, y, width, height
      //ctx.drawImage(img, 174, 174)
      //console.log("IMG natural: ", img.naturalWidth, img.naturalHeight)
      //ctx.drawImage(img, 0, 0, 174, 174)
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const canvasUrl = canvas.toDataURL();
      if (canvasUrl !== fileBase64) {
        setFileBase64(canvasUrl);
        selectedOrganization.image = canvasUrl;
        setSelectedOrganization(selectedOrganization);
      }
    };
  }


  var image = "";
  const editHeaderImage = (event) => {
    const file = event.target.value;
    const actualFile = event.target.files[0];
    const fileObject = URL.createObjectURL(actualFile);
    setFile(fileObject);
  };

  //console.log("USER: ", userdata)
  const orgSaveButton = (
    <Tooltip title="Save any unsaved data" placement="bottom">
      <Button
        style={{ width: 150, height: 55, flex: 1 }}
        variant="outlined"
        color="primary"
        disabled={
          userdata === undefined || userdata === null || userdata.admin !== "true"
        }
        onClick={() =>
          handleEditOrg(
            orgName,
            orgDescription,
            selectedOrganization.id,
            selectedOrganization.image,
            {},
            {},
            [],
          )
        }
      >
        <SaveIcon />
      </Button>
    </Tooltip>
  );

  const [imageUploadError, setImageUploadError] = React.useState("");
  const [openImageModal, setOpenImageModal] = React.useState(false);
  const [scale, setScale] = React.useState(1);
  const [rotate, setRotation] = React.useState(0);
  const [disableImageUpload, setDisableImageUpload] = React.useState(true);
  const [croppedData, setCroppedData] = React.useState(defaultImage);
  const [imageData, setImageData] = useState(selectedOrganization?.image?.lenth > 0 ? selectedOrganization?.image : defaultImage)

  React.useEffect(() => {
    if (file.length > 0) {
      setCroppedData(file);
    } else if (fileBase64 !== undefined && fileBase64 !== null && fileBase64.length > 0) {
      setCroppedData(fileBase64);
    } else {
      setCroppedData(defaultImage);
    }

    if((imageData !== selectedOrganization?.image) && selectedOrganization?.image?.length > 0){
      setImageData(selectedOrganization?.image)
    }
  }, [selectedOrganization, file]);


  const alternateImg = (
    <AddPhotoAlternateIcon
      style={{
        maxWidth: 174,
        maxHeight: 174,
        minWidth: 174,
        minHeight: 174,
        flex: "1",
        display: "flex",
        flexDirection: "row",
        margin: "auto",
        marginTop: 30,
        marginLeft: 40,
      }}
      onClick={() => {
        upload.click();
      }}
    />
  );

  const zoomIn = () => {
    setScale(scale + 0.1);
  };

  const zoomOut = () => {
    setScale(scale - 0.1);
  };

  const rotation = () => {
    setRotation(rotate + 10);
  };

  const onPositionChange = () => {
    setDisableImageUpload(false);
  };

  const onCancelSaveAppIcon = () => {
    setOpenImageModal(false);
    setImageUploadError("");
  };

  let editor;
  const setEditorRef = (imgEditor) => {
    editor = imgEditor;
  };


  const onSaveAppIcon = () => {
        const canvas = editor.getImageScaledToCanvas();
        const newImageData = canvas.toDataURL();
        setCroppedData(newImageData);  // Update croppedData with the new image data
        setOpenImageModal(false);
        setDisableImageUpload(true);
        handleEditOrg(
          orgName,
          orgDescription,
          selectedOrganization.id,
          newImageData,
          {
            app_download_repo: selectedOrganization?.defaults?.app_download_repo,
            app_download_branch: selectedOrganization?.defaults?.app_download_branch,
            workflow_download_repo: selectedOrganization?.defaults?.workflow_download_repo,
            workflow_download_branch: selectedOrganization?.defaults?.workflow_download_branch,
            notification_workflow: selectedOrganization?.defaults?.notification_workflow,
            documentation_reference: selectedOrganization?.defaults?.documentation_reference,
            workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
            workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
            workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
            workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
            newsletter: selectedOrganization?.defaults?.newsletter,
            weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
          },
          {
            sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
            sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
            client_id: selectedOrganization?.sso_config?.client_id,
            client_secret: selectedOrganization?.sso_config?.client_secret,
            openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
            openid_token: selectedOrganization?.sso_config?.openid_token,
            SSORequired: selectedOrganization?.sso_config?.SSORequired,
            auto_provision: selectedOrganization?.sso_config?.auto_provision,
          },
          [],
        )
  };

  const imageInfo = (
    <img
      src={imageData}
      alt="Click to upload an image (174x174)"
      id="logo"
      style={{
        maxWidth: 174,
        maxHeight: 174,
        minWidth: 174,
        minHeight: 174,
        objectFit: "contain",
        borderRadius: 16,
      }}
    />
  );

  const errorText = imageUploadError.length > 0 ? (
    <div style={{ marginTop: 10 }}>Error: {imageUploadError}</div>
  ) : null;


  const imageUploadModalView = openImageModal ? (
    <Dialog
      open={openImageModal}
      onClose={onCancelSaveAppIcon}
      PaperProps={{
        sx: {
            borderRadius: theme?.palette?.DialogStyle?.borderRadius,
            border: theme?.palette?.DialogStyle?.border,
            minWidth: "300px",
            minHeight: "300px",
            fontFamily: theme?.typography?.fontFamily,
            backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
            zIndex: 1000,
            '& .MuiDialogContent-root': {
              backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
            },
            '& .MuiDialogTitle-root': {
              backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
            },
            '& .MuiDialogActions-root': {
              backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
            },
        },
    }}
    >
      <FormControl>
        <DialogTitle>
          <div style={{ color: "rgba(255, 255, 255, 0.9)" }}>Upload Organization Image</div>
        </DialogTitle>
        {errorText}
        <DialogContent style={{ color: "rgba(255, 255, 255, 0.65)" }}>
          <AvatarEditor
            ref={setEditorRef}
            image={croppedData}
            width={174}
            height={174}
            border={50}
            color={[0, 0, 0, 0.6]} // RGBA
            scale={scale}
            rotate={rotate}
            onImageChange={onPositionChange}
            onLoadSuccess={() => setRotation(0)}
          />
          <Divider style={dividerStyle} />
          <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0" }}>
            <Tooltip title="New Icon">
              <Button
                variant="outlined"
                component="label"
                style={appIconStyle}
                onClick={() => { upload.click(); }}
              >
                <AddAPhotoOutlinedIcon style={{ color: "rgba(255, 255, 255, 0.9)" }} />
              </Button>
            </Tooltip>
            <Tooltip title="Zoom In">
              <Button
                variant="outlined"
                component="label"
                style={appIconStyle}
                onClick={zoomIn}
              >
                <ZoomInOutlinedIcon style={{ color: "rgba(255, 255, 255, 0.9)" }} />
              </Button>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button
                variant="outlined"
                component="label"
                style={appIconStyle}
                onClick={zoomOut}
              >
                <ZoomOutOutlinedIcon style={{ color: "rgba(255, 255, 255, 0.9)" }} />
              </Button>
            </Tooltip>
            <Tooltip title="Rotate">
              <Button
                variant="outlined"
                component="label"
                style={appIconStyle}
                onClick={rotation}
              >
                <LoopIcon style={{ color: "rgba(255, 255, 255, 0.9)" }} />
              </Button>
            </Tooltip>
          </div>
          <Divider style={dividerStyle} />
        </DialogContent>
        <DialogActions>
          <Button
            style={{ borderRadius: "2px", fontSize: 16, textTransform: "none", color: "rgba(255, 255, 255, 0.9)" }}
            onClick={onCancelSaveAppIcon}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{ borderRadius: "2px", fontSize: 16, color: "#1a1a1a", backgroundColor: disableImageUpload ? "" : "#ff8544", textTransform: 'none' }}
            disabled={disableImageUpload}
            onClick={onSaveAppIcon}
            color="primary"
          >
            Upload
          </Button>
        </DialogActions>
      </FormControl>
    </Dialog>
  ) : null;


  return (
    <div>
      <div
        style={{
          color: "white",
          flex: "1",
          display: "flex",
          flexDirection: "row",
          borderRadius: 16
        }}
      >
        <Tooltip title="Click to edit the organization's image (174x174)" placement="bottom">
          <div
            style={{
              margin: 10,
              cursor: "pointer",
              // backgroundColor: inputColor,
              maxWidth: 174,
              maxHeight: 174,
              borderRadius: 16,
            }}
            onClick={() => {
              setOpenImageModal(true);
            }}
          >
            <input
              hidden
              type="file"
              ref={(ref) => (upload = ref)}
              onChange={(e) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setCroppedData(event.target.result);
                };
                reader.readAsDataURL(e.target.files[0]);
              }}
            />
            {imageInfo}
          </div>
          {imageUploadModalView}
        </Tooltip>
        <div style={{ marginLeft: 16, alignContent: "center" }}>
          <div >
            <Button
              style={{ backgroundColor: '#ff8544', fontSize: 16, textTransform: 'capitalize', color: "#212121", boxShadow: "none", borderRadius: 4, width: 128, height: 40 }}
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenImageModal(true);
              }}
            >
              {file === null ? "Upload" : "Update"}
            </Button>
          </div>
          <div>
            <Button
              style={{ backgroundColor: '#494949', fontSize: 16, textTransform: 'capitalize', color: "#ffffff", boxShadow: "none", marginTop: 20, borderRadius: 4, width: 128, height: 40 }}
              variant="contained"
              color="primary"
              onClick={() => removeImage()}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgHeader;
