import allure
import pytest


@pytest.fixture(autouse=True)
def _set_allure_parent_suite():
    allure.dynamic.parent_suite('Серверные тесты')
