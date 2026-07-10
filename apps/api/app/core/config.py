from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = ""
    renderer_adapter: str = "stub"
    transport_adapter: str = "stub"
    stub_transport_fail: bool = False
    sync_worker_poll_interval_seconds: float = 5.0

    # Minew MQTT — primary env names (MINEW_* aliases kept for backward compatibility)
    mqtt_host: str = Field(
        default="",
        validation_alias=AliasChoices("MQTT_HOST", "MINEW_MQTT_HOST", "mqtt_host"),
    )
    mqtt_port: int = Field(
        default=1883,
        validation_alias=AliasChoices("MQTT_PORT", "MINEW_MQTT_PORT", "mqtt_port"),
    )
    mqtt_username: str = Field(
        default="",
        validation_alias=AliasChoices("MQTT_USERNAME", "MINEW_MQTT_USERNAME", "mqtt_username"),
    )
    mqtt_password: str = Field(
        default="",
        validation_alias=AliasChoices("MQTT_PASSWORD", "MINEW_MQTT_PASSWORD", "mqtt_password"),
    )
    gateway_mac: str = Field(
        default="",
        validation_alias=AliasChoices("GATEWAY_MAC", "MINEW_GATEWAY_MAC", "gateway_mac"),
    )
    esl_tag_mac: str = Field(
        default="",
        validation_alias=AliasChoices("ESL_TAG_MAC", "MINEW_ESL_TAG_MAC", "esl_tag_mac"),
    )

    minew_mqtt_topic: str = ""
    minew_mqtt_topic_prefix: str = Field(
        default="Mqtt/GateWay",
        validation_alias=AliasChoices(
            "MINEW_MQTT_TOPIC_PREFIX",
            "MQTT_TOPIC_PREFIX",
            "minew_mqtt_topic_prefix",
        ),
    )
    minew_mqtt_topic_suffix: str = Field(
        default="Command",
        validation_alias=AliasChoices(
            "MINEW_MQTT_TOPIC_SUFFIX",
            "MQTT_TOPIC_SUFFIX",
            "minew_mqtt_topic_suffix",
        ),
    )
    minew_mqtt_subscribe_topic: str = Field(
        default="#",
        validation_alias=AliasChoices(
            "MINEW_MQTT_SUBSCRIBE_TOPIC",
            "MQTT_SUBSCRIBE_TOPIC",
            "minew_mqtt_subscribe_topic",
        ),
    )
    minew_mqtt_client_id: str = "lotsync"
    minew_mqtt_timeout_seconds: float = 5.0
    minew_mqtt_msg_type: str = "dData"
    minew_mqtt_auth1: str = "00000000"
    minew_mqtt_dtype: str = "ascii"
    minew_mqtt_downlink_format: str = Field(
        default="jengine",
        validation_alias=AliasChoices(
            "MINEW_MQTT_DOWNLINK_FORMAT",
            "minew_mqtt_downlink_format",
        ),
    )
    minew_jengine_device_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "MINEW_JENGINE_DEVICE_KEY",
            "minew_jengine_device_key",
        ),
    )
    minew_jengine_single_firmware: bool = Field(
        default=True,
        validation_alias=AliasChoices(
            "MINEW_JENGINE_SINGLE_FIRMWARE",
            "minew_jengine_single_firmware",
        ),
    )
    minew_jengine_screen: str = Field(
        default="A",
        validation_alias=AliasChoices("MINEW_JENGINE_SCREEN", "minew_jengine_screen"),
    )
    minew_jengine_compress: str = Field(
        default="NONE",
        validation_alias=AliasChoices("MINEW_JENGINE_COMPRESS", "minew_jengine_compress"),
    )
    minew_jengine_command: str = "02"
    minew_jengine_data_encoding: str = "command02_v1"

    label_qr_fallback_url: str = Field(
        default="",
        validation_alias=AliasChoices("LABEL_QR_FALLBACK_URL", "label_qr_fallback_url"),
    )


settings = Settings()
