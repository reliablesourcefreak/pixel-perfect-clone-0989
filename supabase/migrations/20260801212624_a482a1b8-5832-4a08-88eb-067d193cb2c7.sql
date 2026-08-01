select cron.unschedule(1);
select cron.unschedule(2);

select cron.schedule('atelier-webhook-dispatch', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://xgekguwametrtbsirjig.supabase.co/functions/v1/archive-webhooks?dispatch=1',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWtndXdhbWV0cnRic2lyamlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTgzOTEsImV4cCI6MjA4OTEzNDM5MX0.sR5k98iq109Sk_NDIUi_1l1TN9Wj-6GoNAK3yx8KwYE"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

select cron.schedule('atelier-jobs-process', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://xgekguwametrtbsirjig.supabase.co/functions/v1/archive-jobs?process=1',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWtndXdhbWV0cnRic2lyamlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTgzOTEsImV4cCI6MjA4OTEzNDM5MX0.sR5k98iq109Sk_NDIUi_1l1TN9Wj-6GoNAK3yx8KwYE"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

truncate net._http_response;
truncate cron.job_run_details;

select cron.schedule('atelier-log-cleanup', '17 * * * *', $$
  delete from net._http_response where created < now() - interval '2 days';
  delete from cron.job_run_details where end_time < now() - interval '2 days';
$$);