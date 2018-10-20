kind=$1

if [ $kind = "public" ]
then
	node deploy_contract.js -f '../contracts/public_slot.sol' -c '../../etc/public_contract_config.json' -k "public" -r 8640 -w 8650 \
-a '[100000,1,["0xebb588de5f4adafae88ef326eec78afc5585b844","0x81a5c09bb2f15f4548f458b7f3b4d49080e0eb4a","0x81a5c09bb2f15f4548f458b7f3b4d49080e0eb4a","0x752befae2efee656811eceeeea46a2d6d9621733","0x3c62aa7913bc303ee4b9c07df87b556b6770e3fc"]]' -u "0xebB588dE5f4ADAFAe88ef326eeC78afC5585B844" -p "zhouanxin" 
elif [ $kind = "private" ]
then
	node deploy_contract.js -f '../contracts/private_slot.sol' -c '../../etc/contract_config.json' -r 8540 -w 8450 \
	-a '[100000,1,["0x3c62aa7913bc303ee4b9c07df87b556b6770e3fc","0x752befae2efee656811eceeeea46a2d6d9621733"]]'
else
	echo 'specify public or private'
	exit
fi




