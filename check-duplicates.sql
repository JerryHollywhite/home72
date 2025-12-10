SELECT room_number, COUNT(*) 
FROM rooms 
GROUP BY room_number 
HAVING COUNT(*) > 1;

SELECT room_id, status, COUNT(*)
FROM tenants
WHERE status = 'active'
GROUP BY room_id, status
HAVING COUNT(*) > 1;
