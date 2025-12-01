{{/*
Return the proper image name (for the init container volume-permissions image)
*/}}
{{- define "shuffle.volumePermissions.image" -}}
{{- include "common.images.image" ( dict "imageRoot" .Values.volumePermissions.image "global" .Values.global "chart" .Chart ) -}}
{{- end -}}
