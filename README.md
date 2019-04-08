# gcf-helper

```text
                _____         .__           .__                       
   ____   _____/ ____\        |  |__   ____ |  | ______   ___________ 
  / ___\_/ ___\   __\  ______ |  |  \_/ __ \|  | \____ \_/ __ \_  __ \
 / /_/  >  \___|  |   /_____/ |   Y  \  ___/|  |_|  |_> >  ___/|  | \/
 \___  / \___  >__|           |___|  /\___  >____/   __/ \___  >__|   
/_____/      \/                    \/     \/     |__|        \/       
```

`npm install gcf-helper`


[Documentation](DOC.md)


Works best if you add [apifs-gateway](https://github.com/google-cloud-tools/node-faas-gateway)
as gateway in front of your functions (in case you are using HTTP triggers).

In case you are working with Prometheus and or want to trigger Google Cloud Functions
with Apache Kafka Events or you are looking for a way to produce messages to Apacha Kafka
from GCF, this library works best with [RoachStorm](https://github.com/nodefluent/roach-storm).