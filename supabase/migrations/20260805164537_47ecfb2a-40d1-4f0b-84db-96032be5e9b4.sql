INSERT INTO public.allowed_domains (client_id, domain)
SELECT c.id, 'agniwin.com'
FROM public.api_clients c
WHERE c.id IN (
  '23022d72-8eda-447f-bd77-a291e62055e2',
  '6bbf5eb8-197b-4200-a35b-34db48783c43',
  '7d66ce4d-bf45-416e-ae2e-411d951ee079',
  '7db34ec0-655e-42dd-9e4c-dd86d68cb13c'
)
AND NOT EXISTS (
  SELECT 1 FROM public.allowed_domains d
  WHERE d.client_id = c.id AND lower(d.domain) = 'agniwin.com'
);