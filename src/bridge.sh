trap " kill -9 0 " SIGINT
cd bridge

(
	node to_public.js
) &
(
	node to_private.js
) &
(
	node submitSignature.js
)